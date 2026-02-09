"""
Admin API utility functions
"""

from django.core.mail import send_mail
from django.conf import settings
from .models import AdminAction


def create_audit_log(admin_user, action_type, target_model, target_id, details=None):
    """
    Create audit log entry for admin actions.
    
    Args:
        admin_user: User instance performing the action
        action_type: String describing the action (e.g., 'approve_kyc', 'suspend_user')
        target_model: String name of the target model (e.g., 'user', 'transaction')
        target_id: UUID of the target object
        details: Optional dict with additional action details
    
    Returns:
        AdminAction instance
    """
    return AdminAction.objects.create(
        admin_user=admin_user,
        action_type=action_type,
        target_type=target_model,
        target_id=target_id,
        details=details or {}
    )


def log_admin_action(admin_user, action_type, target_type, target_id, details=None):
    """
    Log admin action for audit trail (legacy function name).
    Calls create_audit_log internally.
    """
    return create_audit_log(admin_user, action_type, target_type, target_id, details)


def send_kyc_decision_email(user, approved, reason=None):
    """Send email notification for KYC decision"""
    if approved:
        subject = "KYC Approved - Precious Vault"
        message = (
            f"Dear {user.first_name or user.email},\n\n"
            f"Your identity verification has been approved. "
            f"You can now trade precious metals on the platform.\n\n"
            f"Best regards,\n"
            f"Precious Vault Team"
        )
    else:
        subject = "KYC Requires Attention - Precious Vault"
        message = (
            f"Dear {user.first_name or user.email},\n\n"
            f"Your identity verification requires attention.\n"
            f"Reason: {reason or 'Please review your submitted documents'}\n\n"
            f"Please resubmit your documents or contact support for assistance.\n\n"
            f"Best regards,\n"
            f"Precious Vault Team"
        )
    
    send_mail(
        subject,
        message,
        settings.EMAIL_HOST_USER or "noreply@preciousvault.com",
        [user.email],
        fail_silently=False,
    )


def send_account_status_email(user, suspended, reason=None):
    """Send email notification for account status change"""
    if suspended:
        subject = "Account Suspended - Precious Vault"
        message = (
            f"Dear {user.first_name or user.email},\n\n"
            f"Your account has been suspended.\n"
            f"Reason: {reason or 'Policy violation'}\n\n"
            f"Please contact support for more information.\n\n"
            f"Best regards,\n"
            f"Precious Vault Team"
        )
    else:
        subject = "Account Activated - Precious Vault"
        message = (
            f"Dear {user.first_name or user.email},\n\n"
            f"Your account has been reactivated. "
            f"You can now access the platform.\n\n"
            f"Best regards,\n"
            f"Precious Vault Team"
        )
    
    send_mail(
        subject,
        message,
        settings.EMAIL_HOST_USER or "noreply@preciousvault.com",
        [user.email],
        fail_silently=False,
    )


def send_shipment_update_email(shipment):
    """Send email notification for shipment status update"""
    user = shipment.user
    subject = f"Shipment Update - {shipment.tracking_number or 'Your Order'}"
    message = (
        f"Dear {user.first_name or user.email},\n\n"
        f"Your shipment status has been updated to: {shipment.get_status_display()}\n"
        f"Tracking Number: {shipment.tracking_number or 'Pending'}\n"
        f"Carrier: {shipment.carrier}\n\n"
        f"You can track your shipment in your account dashboard.\n\n"
        f"Best regards,\n"
        f"Precious Vault Team"
    )
    
    send_mail(
        subject,
        message,
        settings.EMAIL_HOST_USER or "noreply@preciousvault.com",
        [user.email],
        fail_silently=False,
    )
