"""
Admin API views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django.shortcuts import get_object_or_404
from django.db.models import Count, Sum, Q
from django.db import transaction as db_transaction
from decimal import Decimal
from datetime import datetime, timedelta

from users.models import User, Wallet
from trading.models import Transaction, Shipment, ShipmentEvent, PortfolioItem, Metal, Product
from .models import TransactionNote
from .serializers import (
    AdminUserListSerializer, AdminUserDetailSerializer,
    AdminKYCSerializer, AdminTransactionSerializer, TransactionNoteSerializer,
    AdminShipmentSerializer, ShipmentEventSerializer,
    AdminDeliverySerializer, DeliveryItemSerializer, DeliveryHistorySerializer,
    AdminMetalSerializer, AdminProductSerializer
)
from .permissions import IsAdminUser
from .pagination import AdminPagination
from .utils import (
    log_admin_action, send_kyc_decision_email,
    send_account_status_email, send_shipment_update_email
)


class KYCManagementViewSet(viewsets.ViewSet):
    """KYC management endpoints"""
    
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """List users with kyc_status='pending'"""
        queryset = User.objects.filter(
            kyc_status=User.KYCStatus.PENDING
        ).select_related('wallet').prefetch_related('addresses')
        
        queryset = queryset.order_by('-created_at')
        
        # Use pagination
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        
        if page is not None:
            serializer = AdminKYCSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        
        serializer = AdminKYCSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    def retrieve(self, request, pk=None):
        """Get single user KYC details with documents"""
        user = get_object_or_404(User, pk=pk)
        serializer = AdminKYCSerializer(user, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Get user's KYC submission history"""
        user = get_object_or_404(User, pk=pk)
        
        # Get all admin actions related to this user's KYC
        from .models import AdminAction
        kyc_actions = AdminAction.objects.filter(
            target_type='user',
            target_id=user.id,
            action_type__in=['approve_kyc', 'reject_kyc']
        ).select_related('admin_user').order_by('-timestamp')
        
        history = []
        for action in kyc_actions:
            history.append({
                'action_type': action.action_type,
                'admin_user': action.admin_user.email,
                'timestamp': action.timestamp,
                'details': action.details
            })
        
        # Add current status
        current_status = {
            'kyc_status': user.kyc_status,
            'created_at': user.created_at,
            'updated_at': user.updated_at
        }
        
        return Response({
            'user_id': str(user.id),
            'user_email': user.email,
            'current_status': current_status,
            'history': history
        })
    
    def list(self, request):
        """List KYC submissions with filters"""
        kyc_status = request.query_params.get('status', 'pending')
        search = request.query_params.get('search', '')
        
        queryset = User.objects.select_related('wallet').prefetch_related('addresses')
        
        if kyc_status and kyc_status != 'all':
            queryset = queryset.filter(kyc_status=kyc_status)
        
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        queryset = queryset.order_by('-created_at')
        
        # Use pagination
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        
        if page is not None:
            serializer = AdminKYCSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        
        serializer = AdminKYCSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve KYC"""
        user = get_object_or_404(User, pk=pk)
        
        with db_transaction.atomic():
            user.kyc_status = User.KYCStatus.VERIFIED
            user.save()
            
            # Verify address if exists
            if user.addresses.exists():
                user.addresses.update(is_verified=True)
            
            # Log action
            log_admin_action(
                admin_user=request.user,
                action_type='approve_kyc',
                target_type='user',
                target_id=user.id,
                details={'user_email': user.email}
            )
        
        # Send email
        send_kyc_decision_email(user, approved=True)
        
        return Response({
            'message': 'KYC approved successfully',
            'user_id': str(user.id),
            'kyc_status': user.kyc_status
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject KYC with reason"""
        user = get_object_or_404(User, pk=pk)
        reason = request.data.get('reason', 'Document verification failed')
        
        with db_transaction.atomic():
            user.kyc_status = User.KYCStatus.UNVERIFIED
            user.save()
            
            # Log action
            log_admin_action(
                admin_user=request.user,
                action_type='reject_kyc',
                target_type='user',
                target_id=user.id,
                details={'user_email': user.email, 'reason': reason}
            )
        
        # Send email
        send_kyc_decision_email(user, approved=False, reason=reason)
        
        return Response({
            'message': 'KYC rejected',
            'user_id': str(user.id),
            'kyc_status': user.kyc_status
        })
    
    @action(detail=False, methods=['post'])
    def bulk_approve(self, request):
        """Bulk approve KYC requests (max 50 items)"""
        user_ids = request.data.get('user_ids', [])
        
        # Validate user_ids is a list
        if not isinstance(user_ids, list):
            return Response(
                {'error': 'user_ids must be a list'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate maximum 50 items
        if len(user_ids) > 50:
            return Response(
                {'error': 'Maximum 50 items allowed per bulk operation'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(user_ids) == 0:
            return Response(
                {'error': 'user_ids list cannot be empty'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process bulk approval
        successful = []
        failed = []
        
        for user_id in user_ids:
            try:
                with db_transaction.atomic():
                    user = User.objects.get(id=user_id)
                    
                    # Only approve if status is pending
                    if user.kyc_status != User.KYCStatus.PENDING:
                        failed.append({
                            'user_id': str(user_id),
                            'user_email': user.email,
                            'reason': f'User KYC status is {user.kyc_status}, not pending'
                        })
                        continue
                    
                    user.kyc_status = User.KYCStatus.VERIFIED
                    user.save()
                    
                    # Verify address if exists
                    if user.addresses.exists():
                        user.addresses.update(is_verified=True)
                    
                    # Log action
                    log_admin_action(
                        admin_user=request.user,
                        action_type='bulk_approve_kyc',
                        target_type='user',
                        target_id=user.id,
                        details={'user_email': user.email}
                    )
                    
                    # Send email
                    try:
                        send_kyc_decision_email(user, approved=True)
                    except Exception as email_error:
                        # Don't fail the operation if email fails
                        pass
                    
                    successful.append({
                        'user_id': str(user.id),
                        'user_email': user.email,
                        'kyc_status': user.kyc_status
                    })
                    
            except User.DoesNotExist:
                failed.append({
                    'user_id': str(user_id),
                    'reason': 'User not found'
                })
            except Exception as e:
                failed.append({
                    'user_id': str(user_id),
                    'reason': str(e)
                })
        
        return Response({
            'message': f'Bulk approval completed: {len(successful)} successful, {len(failed)} failed',
            'summary': {
                'total_requested': len(user_ids),
                'successful': len(successful),
                'failed': len(failed)
            },
            'successful': successful,
            'failed': failed
        })
    
    @action(detail=False, methods=['post'])
    def bulk_reject(self, request):
        """Bulk reject KYC requests (max 50 items)"""
        user_ids = request.data.get('user_ids', [])
        reason = request.data.get('reason', 'Document verification failed')
        
        # Validate user_ids is a list
        if not isinstance(user_ids, list):
            return Response(
                {'error': 'user_ids must be a list'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate maximum 50 items
        if len(user_ids) > 50:
            return Response(
                {'error': 'Maximum 50 items allowed per bulk operation'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(user_ids) == 0:
            return Response(
                {'error': 'user_ids list cannot be empty'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate reason is provided
        if not reason or not reason.strip():
            return Response(
                {'error': 'Rejection reason is required for bulk rejection'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process bulk rejection
        successful = []
        failed = []
        
        for user_id in user_ids:
            try:
                with db_transaction.atomic():
                    user = User.objects.get(id=user_id)
                    
                    # Only reject if status is pending
                    if user.kyc_status != User.KYCStatus.PENDING:
                        failed.append({
                            'user_id': str(user_id),
                            'user_email': user.email,
                            'reason': f'User KYC status is {user.kyc_status}, not pending'
                        })
                        continue
                    
                    user.kyc_status = User.KYCStatus.UNVERIFIED
                    user.save()
                    
                    # Log action
                    log_admin_action(
                        admin_user=request.user,
                        action_type='bulk_reject_kyc',
                        target_type='user',
                        target_id=user.id,
                        details={'user_email': user.email, 'reason': reason}
                    )
                    
                    # Send email
                    try:
                        send_kyc_decision_email(user, approved=False, reason=reason)
                    except Exception as email_error:
                        # Don't fail the operation if email fails
                        pass
                    
                    successful.append({
                        'user_id': str(user.id),
                        'user_email': user.email,
                        'kyc_status': user.kyc_status
                    })
                    
            except User.DoesNotExist:
                failed.append({
                    'user_id': str(user_id),
                    'reason': 'User not found'
                })
            except Exception as e:
                failed.append({
                    'user_id': str(user_id),
                    'reason': str(e)
                })
        
        return Response({
            'message': f'Bulk rejection completed: {len(successful)} successful, {len(failed)} failed',
            'summary': {
                'total_requested': len(user_ids),
                'successful': len(successful),
                'failed': len(failed)
            },
            'successful': successful,
            'failed': failed
        })


class UserManagementViewSet(viewsets.ReadOnlyModelViewSet):
    """User management endpoints"""
    
    permission_classes = [IsAdminUser]
    queryset = User.objects.all()
    pagination_class = AdminPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['email', 'first_name', 'last_name', 'username']
    ordering_fields = ['created_at', 'email', 'last_login']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return AdminUserListSerializer
        return AdminUserDetailSerializer
    
    def get_queryset(self):
        return User.objects.select_related('wallet').prefetch_related('addresses')
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search users by username, email, or user ID"""
        query = request.query_params.get('q', '').strip()
        
        if not query:
            return Response({
                'results': [],
                'count': 0,
                'message': 'Please provide a search query'
            })
        
        # Search by email, username, first name, last name, or ID
        queryset = User.objects.select_related('wallet').prefetch_related('addresses')
        
        # Try to search by ID first (UUID)
        try:
            user = queryset.get(id=query)
            serializer = AdminUserListSerializer([user], many=True)
            return Response({
                'results': serializer.data,
                'count': 1,
                'page': 1,
                'page_size': 1,
                'total_pages': 1
            })
        except (User.DoesNotExist, ValueError):
            pass
        
        # Search by other fields
        queryset = queryset.filter(
            Q(email__icontains=query) |
            Q(username__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        ).order_by('-created_at')
        
        # Use pagination
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        
        if page is not None:
            serializer = AdminUserListSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = AdminUserListSerializer(queryset, many=True)
        return Response({
            'results': serializer.data,
            'count': queryset.count()
        })
    
    @action(detail=True, methods=['get'])
    def activity(self, request, pk=None):
        """Get user activity timeline"""
        user = get_object_or_404(User, pk=pk)
        
        # Collect all activities
        activities = []
        
        # Add login activity
        if user.last_login:
            activities.append({
                'type': 'login',
                'timestamp': user.last_login,
                'description': 'User logged in'
            })
        
        # Add account creation
        activities.append({
            'type': 'account_created',
            'timestamp': user.created_at,
            'description': 'Account created'
        })
        
        # Add KYC submissions
        from .models import AdminAction
        kyc_actions = AdminAction.objects.filter(
            target_type='user',
            target_id=user.id,
            action_type__in=['approve_kyc', 'reject_kyc']
        ).order_by('-timestamp')
        
        for action in kyc_actions:
            activities.append({
                'type': 'kyc_action',
                'timestamp': action.timestamp,
                'description': f"KYC {action.action_type.replace('_', ' ')} by {action.admin_user.email}",
                'details': action.details
            })
        
        # Add transactions
        transactions = Transaction.objects.filter(user=user).order_by('-created_at')[:20]
        for txn in transactions:
            activities.append({
                'type': 'transaction',
                'timestamp': txn.created_at,
                'description': f"{txn.transaction_type.title()} transaction - ${txn.total_value}",
                'details': {
                    'transaction_id': str(txn.id),
                    'type': txn.transaction_type,
                    'amount': str(txn.total_value),
                    'status': txn.status
                }
            })
        
        # Add delivery requests
        shipments = Shipment.objects.filter(user=user).order_by('-created_at')[:10]
        for shipment in shipments:
            activities.append({
                'type': 'delivery_request',
                'timestamp': shipment.created_at,
                'description': f"Delivery request - {shipment.status}",
                'details': {
                    'shipment_id': str(shipment.id),
                    'tracking_number': shipment.tracking_number,
                    'status': shipment.status
                }
            })
        
        # Add account status changes
        status_actions = AdminAction.objects.filter(
            target_type='user',
            target_id=user.id,
            action_type__in=['suspend_user', 'activate_user', 'adjust_balance']
        ).order_by('-timestamp')
        
        for action in status_actions:
            activities.append({
                'type': 'account_action',
                'timestamp': action.timestamp,
                'description': f"{action.action_type.replace('_', ' ').title()} by {action.admin_user.email}",
                'details': action.details
            })
        
        # Sort all activities by timestamp descending
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return Response({
            'user_id': str(user.id),
            'user_email': user.email,
            'activities': activities[:50]  # Limit to 50 most recent
        })
    
    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """Suspend user account"""
        user = get_object_or_404(User, pk=pk)
        reason = request.data.get('reason', 'Policy violation')
        
        with db_transaction.atomic():
            user.is_active = False
            user.save()
            
            log_admin_action(
                admin_user=request.user,
                action_type='suspend_user',
                target_type='user',
                target_id=user.id,
                details={'user_email': user.email, 'reason': reason}
            )
        
        send_account_status_email(user, suspended=True, reason=reason)
        
        return Response({'message': 'User suspended successfully'})
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate user account"""
        user = get_object_or_404(User, pk=pk)
        
        with db_transaction.atomic():
            user.is_active = True
            user.save()
            
            log_admin_action(
                admin_user=request.user,
                action_type='activate_user',
                target_type='user',
                target_id=user.id,
                details={'user_email': user.email}
            )
        
        send_account_status_email(user, suspended=False)
        
        return Response({'message': 'User activated successfully'})
    
    @action(detail=True, methods=['post'])
    def adjust_balance(self, request, pk=None):
        """Adjust user wallet balance"""
        user = get_object_or_404(User, pk=pk)
        amount = request.data.get('amount')
        reason = request.data.get('reason', 'Admin adjustment')
        
        if not amount:
            return Response(
                {'error': 'Amount is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            amount_decimal = Decimal(str(amount))
        except:
            return Response(
                {'error': 'Invalid amount format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with db_transaction.atomic():
            # Get or create wallet
            wallet, created = Wallet.objects.get_or_create(user=user)
            
            old_balance = wallet.cash_balance
            wallet.cash_balance += amount_decimal
            wallet.save()
            
            # Create transaction record
            Transaction.objects.create(
                user=user,
                transaction_type='deposit' if amount_decimal > 0 else 'withdrawal',
                total_value=abs(amount_decimal),
                status=Transaction.Status.COMPLETED
            )
            
            log_admin_action(
                admin_user=request.user,
                action_type='adjust_balance',
                target_type='user',
                target_id=user.id,
                details={
                    'user_email': user.email,
                    'amount': str(amount_decimal),
                    'old_balance': str(old_balance),
                    'new_balance': str(wallet.cash_balance),
                    'reason': reason
                }
            )
        
        return Response({
            'message': 'Balance adjusted successfully',
            'old_balance': float(old_balance),
            'new_balance': float(wallet.cash_balance)
        })


# Keep the old name as an alias for backward compatibility
AdminUserViewSet = UserManagementViewSet


class AdminTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """Transaction management endpoints"""
    
    permission_classes = [IsAdminUser]
    queryset = Transaction.objects.all()
    serializer_class = AdminTransactionSerializer
    pagination_class = AdminPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['user__email', 'id']
    ordering_fields = ['created_at', 'total_value']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = Transaction.objects.select_related('user', 'metal').prefetch_related('admin_notes')
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by transaction type
        type_filter = self.request.query_params.get('type')
        if type_filter:
            queryset = queryset.filter(transaction_type=type_filter)
        
        # Filter by user
        user_filter = self.request.query_params.get('user')
        if user_filter:
            queryset = queryset.filter(user_id=user_filter)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        # Filter by amount threshold
        amount_min = self.request.query_params.get('amount_min')
        amount_max = self.request.query_params.get('amount_max')
        if amount_min:
            queryset = queryset.filter(total_value__gte=amount_min)
        if amount_max:
            queryset = queryset.filter(total_value__lte=amount_max)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """List transactions with status='pending' ordered by amount and age"""
        queryset = Transaction.objects.filter(
            status=Transaction.Status.PENDING
        ).select_related('user', 'metal').prefetch_related('admin_notes')
        
        # Order by amount descending, then by age (created_at ascending = oldest first)
        queryset = queryset.order_by('-total_value', 'created_at')
        
        # Use pagination
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a pending transaction and execute transaction logic"""
        transaction_obj = get_object_or_404(Transaction, pk=pk)
        
        if transaction_obj.status != Transaction.Status.PENDING:
            return Response(
                {'error': f'Transaction is not pending (current status: {transaction_obj.status})'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with db_transaction.atomic():
            # Update transaction status
            transaction_obj.status = Transaction.Status.COMPLETED
            transaction_obj.save()
            
            # Execute transaction logic based on type
            if transaction_obj.transaction_type == Transaction.TransactionType.BUY:
                # For buy transactions, create portfolio item
                if transaction_obj.metal and transaction_obj.amount_oz:
                    # Get user's wallet
                    wallet = Wallet.objects.get(user=transaction_obj.user)
                    
                    # Deduct from cash balance (should already be held)
                    wallet.cash_balance -= transaction_obj.total_value
                    wallet.save()
                    
                    # Create portfolio item (simplified - in real system would link to product)
                    PortfolioItem.objects.create(
                        user=transaction_obj.user,
                        metal=transaction_obj.metal,
                        product=None,  # Would need product reference
                        weight_oz=transaction_obj.amount_oz,
                        quantity=1,
                        purchase_price=transaction_obj.price_per_oz,
                        status=PortfolioItem.Status.VAULTED
                    )
            
            elif transaction_obj.transaction_type == Transaction.TransactionType.SELL:
                # For sell transactions, add to cash balance
                wallet = Wallet.objects.get(user=transaction_obj.user)
                wallet.cash_balance += transaction_obj.total_value
                wallet.save()
            
            # Log admin action
            log_admin_action(
                admin_user=request.user,
                action_type='approve_transaction',
                target_type='transaction',
                target_id=transaction_obj.id,
                details={
                    'transaction_type': transaction_obj.transaction_type,
                    'user_email': transaction_obj.user.email,
                    'total_value': str(transaction_obj.total_value)
                }
            )
        
        return Response({
            'message': 'Transaction approved successfully',
            'transaction_id': str(transaction_obj.id),
            'status': transaction_obj.status
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a pending transaction with reason and refund held funds"""
        transaction_obj = get_object_or_404(Transaction, pk=pk)
        reason = request.data.get('reason')
        
        if not reason:
            return Response(
                {'error': 'Rejection reason is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if transaction_obj.status != Transaction.Status.PENDING:
            return Response(
                {'error': f'Transaction is not pending (current status: {transaction_obj.status})'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with db_transaction.atomic():
            # Update transaction status
            transaction_obj.status = Transaction.Status.FAILED
            transaction_obj.save()
            
            # Refund held funds for buy transactions
            if transaction_obj.transaction_type == Transaction.TransactionType.BUY:
                wallet = Wallet.objects.get(user=transaction_obj.user)
                wallet.cash_balance += transaction_obj.total_value
                wallet.save()
            
            # Log admin action
            log_admin_action(
                admin_user=request.user,
                action_type='reject_transaction',
                target_type='transaction',
                target_id=transaction_obj.id,
                details={
                    'transaction_type': transaction_obj.transaction_type,
                    'user_email': transaction_obj.user.email,
                    'total_value': str(transaction_obj.total_value),
                    'reason': reason
                }
            )
        
        return Response({
            'message': 'Transaction rejected',
            'transaction_id': str(transaction_obj.id),
            'status': transaction_obj.status,
            'reason': reason
        })
    
    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        """Add admin note to transaction"""
        transaction = get_object_or_404(Transaction, pk=pk)
        note_text = request.data.get('note')
        
        if not note_text:
            return Response(
                {'error': 'Note is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        note = TransactionNote.objects.create(
            transaction=transaction,
            admin_user=request.user,
            note=note_text
        )
        
        serializer = TransactionNoteSerializer(note)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminShipmentViewSet(viewsets.ModelViewSet):
    """Shipment management endpoints"""
    
    permission_classes = [IsAdminUser]
    queryset = Shipment.objects.all()
    serializer_class = AdminShipmentSerializer
    pagination_class = AdminPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['tracking_number', 'user__email']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Shipment.objects.select_related('user').prefetch_related('items', 'events')
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update shipment status"""
        shipment = get_object_or_404(Shipment, pk=pk)
        new_status = request.data.get('status')
        
        if not new_status:
            return Response(
                {'error': 'Status is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with db_transaction.atomic():
            old_status = shipment.status
            shipment.status = new_status
            shipment.save()
            
            # Create event
            ShipmentEvent.objects.create(
                shipment=shipment,
                status=new_status,
                description=f"Status updated from {old_status} to {new_status}",
                location="Admin Update"
            )
            
            # Update portfolio items if delivered
            if new_status == Shipment.Status.DELIVERED:
                shipment.items.update(status=PortfolioItem.Status.DELIVERED)
            
            log_admin_action(
                admin_user=request.user,
                action_type='update_shipment_status',
                target_type='shipment',
                target_id=shipment.id,
                details={
                    'tracking_number': shipment.tracking_number,
                    'old_status': old_status,
                    'new_status': new_status
                }
            )
        
        send_shipment_update_email(shipment)
        
        serializer = self.get_serializer(shipment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_event(self, request, pk=None):
        """Add tracking event"""
        shipment = get_object_or_404(Shipment, pk=pk)
        
        event_status = request.data.get('status')
        description = request.data.get('description')
        location = request.data.get('location', '')
        
        if not event_status or not description:
            return Response(
                {'error': 'Status and description are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        event = ShipmentEvent.objects.create(
            shipment=shipment,
            status=event_status,
            description=description,
            location=location
        )
        
        serializer = ShipmentEventSerializer(event)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DeliveryManagementViewSet(viewsets.ReadOnlyModelViewSet):
    """Delivery management endpoints for admin"""
    
    permission_classes = [IsAdminUser]
    queryset = Shipment.objects.all()
    serializer_class = AdminDeliverySerializer
    pagination_class = AdminPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['tracking_number', 'user__email', 'carrier']
    ordering_fields = ['created_at', 'updated_at', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Get shipments with filtering"""
        queryset = Shipment.objects.select_related('user').prefetch_related('items', 'events')
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by user
        user_filter = self.request.query_params.get('user')
        if user_filter:
            queryset = queryset.filter(user_id=user_filter)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        # Filter by carrier
        carrier_filter = self.request.query_params.get('carrier')
        if carrier_filter:
            queryset = queryset.filter(carrier__icontains=carrier_filter)
        
        return queryset
    
    def list(self, request):
        """List deliveries with filtering and pagination"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Use DRF pagination (inherited from ReadOnlyModelViewSet)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, pk=None):
        """Get delivery details"""
        delivery = get_object_or_404(self.get_queryset(), pk=pk)
        serializer = self.get_serializer(delivery)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Get delivery history events"""
        delivery = get_object_or_404(Shipment, pk=pk)
        
        # Get all events for this delivery
        events = delivery.events.all().order_by('-timestamp')
        
        serializer = DeliveryHistorySerializer(events, many=True)
        
        return Response({
            'delivery_id': str(delivery.id),
            'tracking_number': delivery.tracking_number,
            'current_status': delivery.status,
            'history': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update delivery status and create history entry"""
        delivery = get_object_or_404(Shipment, pk=pk)
        new_status = request.data.get('status')
        description = request.data.get('description', '')
        location = request.data.get('location', '')
        
        if not new_status:
            return Response(
                {'error': 'Status is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate status is a valid choice
        valid_statuses = [choice[0] for choice in Shipment.Status.choices]
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with db_transaction.atomic():
            old_status = delivery.status
            delivery.status = new_status
            delivery.save()
            
            # Create DeliveryHistory entry (ShipmentEvent)
            if not description:
                description = f"Status updated from {old_status} to {new_status}"
            
            ShipmentEvent.objects.create(
                shipment=delivery,
                status=new_status,
                description=description,
                location=location or "Admin Update"
            )
            
            # Update portfolio items if delivered
            if new_status == Shipment.Status.DELIVERED:
                delivery.items.update(status=PortfolioItem.Status.DELIVERED)
            elif new_status in [Shipment.Status.SHIPPED, Shipment.Status.IN_TRANSIT, Shipment.Status.OUT_FOR_DELIVERY]:
                delivery.items.update(status=PortfolioItem.Status.IN_TRANSIT)
            
            # Log admin action
            log_admin_action(
                admin_user=request.user,
                action_type='update_delivery_status',
                target_type='shipment',
                target_id=delivery.id,
                details={
                    'tracking_number': delivery.tracking_number,
                    'user_email': delivery.user.email,
                    'old_status': old_status,
                    'new_status': new_status,
                    'description': description
                }
            )
        
        # Send notification email
        send_shipment_update_email(delivery)
        
        # Return updated delivery
        serializer = self.get_serializer(delivery)
        return Response({
            'message': 'Delivery status updated successfully',
            'delivery': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def assign_carrier(self, request, pk=None):
        """Assign carrier and tracking number to delivery"""
        delivery = get_object_or_404(Shipment, pk=pk)
        carrier = request.data.get('carrier')
        tracking_number = request.data.get('tracking_number')
        
        if not carrier:
            return Response(
                {'error': 'Carrier is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not tracking_number:
            return Response(
                {'error': 'Tracking number is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if tracking number already exists for another shipment
        existing = Shipment.objects.filter(tracking_number=tracking_number).exclude(id=delivery.id).first()
        if existing:
            return Response(
                {'error': f'Tracking number {tracking_number} is already assigned to another shipment'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with db_transaction.atomic():
            old_carrier = delivery.carrier
            old_tracking = delivery.tracking_number
            
            delivery.carrier = carrier
            delivery.tracking_number = tracking_number
            delivery.save()
            
            # Create history event
            ShipmentEvent.objects.create(
                shipment=delivery,
                status=delivery.status,
                description=f"Carrier assigned: {carrier}, Tracking: {tracking_number}",
                location="Admin Assignment"
            )
            
            # Log admin action
            log_admin_action(
                admin_user=request.user,
                action_type='assign_delivery_carrier',
                target_type='shipment',
                target_id=delivery.id,
                details={
                    'user_email': delivery.user.email,
                    'old_carrier': old_carrier,
                    'new_carrier': carrier,
                    'old_tracking_number': old_tracking,
                    'new_tracking_number': tracking_number
                }
            )
        
        # Send notification email
        send_shipment_update_email(delivery)
        
        # Return updated delivery
        serializer = self.get_serializer(delivery)
        return Response({
            'message': 'Carrier and tracking number assigned successfully',
            'delivery': serializer.data
        })


class AdminDashboardViewSet(viewsets.ViewSet):
    """Dashboard statistics endpoints"""
    
    permission_classes = [IsAdminUser]
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get dashboard statistics (legacy endpoint)"""
        
        # User stats
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        pending_kyc = User.objects.filter(kyc_status=User.KYCStatus.PENDING).count()
        
        # Transaction stats
        pending_transactions = Transaction.objects.filter(status=Transaction.Status.PENDING).count()
        total_transaction_value = Transaction.objects.filter(
            status=Transaction.Status.COMPLETED
        ).aggregate(total=Sum('total_value'))['total'] or 0
        
        # Shipment stats
        active_shipments = Shipment.objects.exclude(
            status__in=[Shipment.Status.DELIVERED, Shipment.Status.FAILED]
        ).count()
        
        # Holdings stats
        holdings = {}
        for metal in Metal.objects.all():
            total_oz = PortfolioItem.objects.filter(
                metal=metal,
                status=PortfolioItem.Status.VAULTED
            ).aggregate(total=Sum('weight_oz'))['total'] or 0
            
            holdings[metal.symbol] = {
                'name': metal.name,
                'total_oz': float(total_oz),
                'total_value': float(total_oz * metal.current_price)
            }
        
        return Response({
            'users': {
                'total': total_users,
                'active': active_users,
                'pending_kyc': pending_kyc
            },
            'transactions': {
                'pending': pending_transactions,
                'total_value': float(total_transaction_value)
            },
            'shipments': {
                'active': active_shipments
            },
            'holdings': holdings
        })


class DashboardMetricsView(viewsets.ViewSet):
    """Dashboard metrics with caching"""
    
    permission_classes = [IsAdminUser]
    
    @action(detail=False, methods=['get'])
    def metrics(self, request):
        """Get detailed metrics with Redis caching (60 second TTL)"""
        from django.core.cache import cache
        from datetime import datetime, timedelta
        
        cache_key = 'admin_dashboard_metrics'
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        # Calculate current period metrics
        now = datetime.now()
        thirty_days_ago = now - timedelta(days=30)
        sixty_days_ago = now - timedelta(days=60)
        
        # User metrics
        total_users = User.objects.count()
        active_users_30d = User.objects.filter(
            last_login__gte=thirty_days_ago
        ).count()
        pending_kyc = User.objects.filter(
            kyc_status=User.KYCStatus.PENDING
        ).count()
        
        # Previous period for trends
        prev_total_users = User.objects.filter(
            created_at__lt=thirty_days_ago
        ).count()
        prev_active_users = User.objects.filter(
            last_login__gte=sixty_days_ago,
            last_login__lt=thirty_days_ago
        ).count()
        
        # Transaction metrics
        pending_transactions = Transaction.objects.filter(
            status=Transaction.Status.PENDING
        ).count()
        
        transaction_volume_30d = Transaction.objects.filter(
            status=Transaction.Status.COMPLETED,
            created_at__gte=thirty_days_ago
        ).aggregate(total=Sum('total_value'))['total'] or Decimal('0')
        
        prev_transaction_volume = Transaction.objects.filter(
            status=Transaction.Status.COMPLETED,
            created_at__gte=sixty_days_ago,
            created_at__lt=thirty_days_ago
        ).aggregate(total=Sum('total_value'))['total'] or Decimal('0')
        
        # Delivery metrics
        active_deliveries = Shipment.objects.exclude(
            status__in=[Shipment.Status.DELIVERED, Shipment.Status.FAILED]
        ).count()
        
        prev_active_deliveries = Shipment.objects.filter(
            created_at__gte=sixty_days_ago,
            created_at__lt=thirty_days_ago
        ).exclude(
            status__in=[Shipment.Status.DELIVERED, Shipment.Status.FAILED]
        ).count()
        
        # Calculate trends (percentage change)
        def calculate_trend(current, previous):
            if previous == 0:
                return 100.0 if current > 0 else 0.0
            return round(((current - previous) / previous) * 100, 2)
        
        trends = {
            'total_users': calculate_trend(total_users, prev_total_users),
            'active_users_30d': calculate_trend(active_users_30d, prev_active_users),
            'transaction_volume': calculate_trend(
                float(transaction_volume_30d),
                float(prev_transaction_volume)
            ),
            'active_deliveries': calculate_trend(active_deliveries, prev_active_deliveries)
        }
        
        metrics_data = {
            'total_users': total_users,
            'active_users_30d': active_users_30d,
            'pending_kyc': pending_kyc,
            'pending_transactions': pending_transactions,
            'active_deliveries': active_deliveries,
            'transaction_volume': float(transaction_volume_30d),
            'trends': trends
        }
        
        # Cache for 60 seconds
        cache.set(cache_key, metrics_data, 60)
        
        return Response(metrics_data)


class DashboardAlertsView(viewsets.ViewSet):
    """Dashboard alerts for items requiring attention"""
    
    permission_classes = [IsAdminUser]
    
    @action(detail=False, methods=['get'])
    def alerts(self, request):
        """Return items requiring attention (old pending items)"""
        from datetime import datetime, timedelta
        
        now = datetime.now()
        kyc_threshold = now - timedelta(hours=48)
        transaction_threshold = now - timedelta(hours=24)
        
        # Old pending KYC requests (> 48 hours)
        old_kyc = User.objects.filter(
            kyc_status=User.KYCStatus.PENDING,
            created_at__lt=kyc_threshold
        ).values('id', 'email', 'created_at')
        
        # Old pending transactions (> 24 hours)
        old_transactions = Transaction.objects.filter(
            status=Transaction.Status.PENDING,
            created_at__lt=transaction_threshold
        ).select_related('user').values(
            'id', 'user__email', 'transaction_type', 'total_value', 'created_at'
        )
        
        alerts = {
            'old_kyc_requests': [
                {
                    'user_id': str(item['id']),
                    'user_email': item['email'],
                    'submitted_at': item['created_at'],
                    'age_hours': int((now - item['created_at']).total_seconds() / 3600)
                }
                for item in old_kyc
            ],
            'old_pending_transactions': [
                {
                    'transaction_id': str(item['id']),
                    'user_email': item['user__email'],
                    'type': item['transaction_type'],
                    'amount': float(item['total_value']),
                    'created_at': item['created_at'],
                    'age_hours': int((now - item['created_at']).total_seconds() / 3600)
                }
                for item in old_transactions
            ]
        }
        
        return Response(alerts)


class DashboardRecentActionsView(viewsets.ViewSet):
    """Dashboard recent admin actions"""
    
    permission_classes = [IsAdminUser]
    
    @action(detail=False, methods=['get'])
    def recent_actions(self, request):
        """Return recent audit log entries"""
        from .models import AdminAction
        
        # Get last 20 admin actions
        recent_actions = AdminAction.objects.select_related(
            'admin_user'
        ).order_by('-timestamp')[:20]
        
        actions_data = [
            {
                'id': str(action.id),
                'admin_user': action.admin_user.email,
                'action_type': action.action_type,
                'target_type': action.target_type,
                'target_id': str(action.target_id),
                'details': action.details,
                'timestamp': action.timestamp
            }
            for action in recent_actions
        ]
        
        return Response({
            'actions': actions_data,
            'count': len(actions_data)
        })


class VaultInventoryView(viewsets.ViewSet):
    """Vault inventory aggregation"""
    
    permission_classes = [IsAdminUser]
    
    @action(detail=False, methods=['get'])
    def inventory(self, request):
        """Aggregate vault assets by metal type"""
        from vaults.models import Vault
        
        # Get all vaulted portfolio items grouped by metal
        inventory = {}
        
        for metal in Metal.objects.all():
            # Get total vaulted quantity for this metal
            vaulted_items = PortfolioItem.objects.filter(
                metal=metal,
                status=PortfolioItem.Status.VAULTED
            ).aggregate(
                total_weight=Sum('weight_oz'),
                total_quantity=Sum('quantity')
            )
            
            total_weight = vaulted_items['total_weight'] or Decimal('0')
            total_quantity = vaulted_items['total_quantity'] or 0
            
            # Get breakdown by vault location
            by_vault = []
            vault_items = PortfolioItem.objects.filter(
                metal=metal,
                status=PortfolioItem.Status.VAULTED,
                vault_location__isnull=False
            ).values('vault_location__name', 'vault_location__city', 'vault_location__country').annotate(
                vault_weight=Sum('weight_oz'),
                vault_quantity=Sum('quantity')
            )
            
            for item in vault_items:
                by_vault.append({
                    'vault_name': item['vault_location__name'],
                    'vault_city': item['vault_location__city'],
                    'vault_country': item['vault_location__country'],
                    'weight_oz': float(item['vault_weight']),
                    'quantity': item['vault_quantity']
                })
            
            inventory[metal.symbol] = {
                'metal_name': metal.name,
                'metal_symbol': metal.symbol,
                'total_weight_oz': float(total_weight),
                'total_quantity': total_quantity,
                'current_price_per_oz': float(metal.current_price),
                'total_value': float(total_weight * metal.current_price),
                'by_vault': by_vault
            }
        
        return Response({
            'inventory': inventory,
            'last_updated': datetime.now()
        })


class TransactionVolumeView(viewsets.ViewSet):
    """Transaction volume aggregation"""
    
    permission_classes = [IsAdminUser]
    
    @action(detail=False, methods=['get'])
    def volume(self, request):
        """Calculate daily, weekly, monthly transaction totals"""
        from datetime import datetime, timedelta
        
        now = datetime.now()
        one_day_ago = now - timedelta(days=1)
        seven_days_ago = now - timedelta(days=7)
        thirty_days_ago = now - timedelta(days=30)
        
        # Daily volume (last 24 hours)
        daily_volume = Transaction.objects.filter(
            status=Transaction.Status.COMPLETED,
            created_at__gte=one_day_ago
        ).aggregate(
            total_value=Sum('total_value'),
            count=Count('id')
        )
        
        # Weekly volume (last 7 days)
        weekly_volume = Transaction.objects.filter(
            status=Transaction.Status.COMPLETED,
            created_at__gte=seven_days_ago
        ).aggregate(
            total_value=Sum('total_value'),
            count=Count('id')
        )
        
        # Monthly volume (last 30 days)
        monthly_volume = Transaction.objects.filter(
            status=Transaction.Status.COMPLETED,
            created_at__gte=thirty_days_ago
        ).aggregate(
            total_value=Sum('total_value'),
            count=Count('id')
        )
        
        # Volume by transaction type (last 30 days)
        by_type = Transaction.objects.filter(
            status=Transaction.Status.COMPLETED,
            created_at__gte=thirty_days_ago
        ).values('transaction_type').annotate(
            total_value=Sum('total_value'),
            count=Count('id')
        )
        
        volume_by_type = {
            item['transaction_type']: {
                'total_value': float(item['total_value'] or 0),
                'count': item['count']
            }
            for item in by_type
        }
        
        return Response({
            'daily': {
                'total_value': float(daily_volume['total_value'] or 0),
                'transaction_count': daily_volume['count'],
                'period': '24 hours'
            },
            'weekly': {
                'total_value': float(weekly_volume['total_value'] or 0),
                'transaction_count': weekly_volume['count'],
                'period': '7 days'
            },
            'monthly': {
                'total_value': float(monthly_volume['total_value'] or 0),
                'transaction_count': monthly_volume['count'],
                'period': '30 days'
            },
            'by_type': volume_by_type,
            'calculated_at': now
        })


class MetalPricesView(viewsets.ViewSet):
    """Current metal prices"""
    
    permission_classes = [IsAdminUser]
    
    @action(detail=False, methods=['get'])
    def prices(self, request):
        """Return current metal prices with last update timestamp"""
        
        metals = Metal.objects.all()
        
        prices_data = [
            {
                'id': str(metal.id),
                'name': metal.name,
                'symbol': metal.symbol,
                'current_price': float(metal.current_price),
                'price_change_24h': float(metal.price_change_24h),
                'last_updated': metal.last_updated
            }
            for metal in metals
        ]
        
        return Response({
            'metals': prices_data,
            'count': len(prices_data)
        })




class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Audit log endpoints"""
    
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['action_type', 'admin_user__email', 'target_type']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']  # Order by timestamp descending
    
    def get_queryset(self):
        """Get audit logs with filtering"""
        from .models import AdminAction
        
        queryset = AdminAction.objects.select_related('admin_user')
        
        # Filter by action_type
        action_type = self.request.query_params.get('action_type')
        if action_type:
            queryset = queryset.filter(action_type=action_type)
        
        # Filter by admin_user
        admin_user = self.request.query_params.get('admin_user')
        if admin_user:
            queryset = queryset.filter(admin_user_id=admin_user)
        
        # Filter by date_range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(timestamp__gte=date_from)
        if date_to:
            queryset = queryset.filter(timestamp__lte=date_to)
        
        # Filter by target_object (target_type and optionally target_id)
        target_type = self.request.query_params.get('target_type')
        if target_type:
            queryset = queryset.filter(target_type=target_type)
        
        target_id = self.request.query_params.get('target_id')
        if target_id:
            queryset = queryset.filter(target_id=target_id)
        
        return queryset
    
    def get_serializer_class(self):
        from .serializers import AdminActionSerializer
        return AdminActionSerializer
    
    def list(self, request):
        """List audit logs with filtering and pagination"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Use DRF pagination (inherited from ReadOnlyModelViewSet)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, pk=None):
        """Get audit log details"""
        audit_log = get_object_or_404(self.get_queryset(), pk=pk)
        serializer = self.get_serializer(audit_log)
        return Response(serializer.data)


class AdminProductViewSet(viewsets.ModelViewSet):
    """Product management endpoints"""
    
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        if self.action in ['list_metals', 'update_metal_price']:
            return Metal.objects.all()
        return Product.objects.select_related('metal')
    
    def get_serializer_class(self):
        if self.action in ['list_metals', 'update_metal_price']:
            return AdminMetalSerializer
        return AdminProductSerializer
    
    @action(detail=False, methods=['get'], url_path='metals')
    def list_metals(self, request):
        """List all metals"""
        metals = Metal.objects.all()
        serializer = AdminMetalSerializer(metals, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'], url_path='metals/(?P<metal_id>[^/.]+)/update-price')
    def update_metal_price(self, request, metal_id=None, pk=None):
        """Update metal price"""
        metal = get_object_or_404(Metal, pk=metal_id)
        
        new_price = request.data.get('price')
        price_change = request.data.get('price_change_24h')
        
        if not new_price:
            return Response(
                {'error': 'Price is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            new_price_decimal = Decimal(str(new_price))
        except:
            return Response(
                {'error': 'Invalid price format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with db_transaction.atomic():
            old_price = metal.current_price
            metal.current_price = new_price_decimal
            
            if price_change is not None:
                metal.price_change_24h = Decimal(str(price_change))
            
            metal.save()
            
            log_admin_action(
                admin_user=request.user,
                action_type='update_metal_price',
                target_type='metal',
                target_id=metal.id,
                details={
                    'metal': metal.name,
                    'old_price': str(old_price),
                    'new_price': str(new_price_decimal)
                }
            )
        
        serializer = AdminMetalSerializer(metal)
        return Response(serializer.data)
