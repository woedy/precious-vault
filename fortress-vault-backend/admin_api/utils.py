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
    from utils.emails import send_html_email
    
    if approved:
        subject = "KYC Approved - Fortress Vault"
    else:
        subject = "KYC Requires Attention - Fortress Vault"
        
    send_html_email(
        subject=subject,
        template_name="emails/kyc_status.html",
        context={
            'user': user, 
            'approved': approved, 
            'reason': reason
        },
        recipient_list=[user.email]
    )


def send_account_status_email(user, suspended, reason=None):
    """Send email notification for account status change"""
    from utils.emails import send_html_email
    
    if suspended:
        subject = "Account Suspended - Fortress Vault"
    else:
        subject = "Account Activated - Fortress Vault"
        
    send_html_email(
        subject=subject,
        template_name="emails/account_status.html",
        context={
            'user': user, 
            'suspended': suspended, 
            'reason': reason
        },
        recipient_list=[user.email]
    )


def send_shipment_update_email(shipment):
    """Send email notification for shipment status update"""
    from utils.emails import send_html_email
    
    user = shipment.user
    subject = f"Shipment Update - {shipment.tracking_number or 'Your Order'}"
    
    send_html_email(
        subject=subject,
        template_name="emails/shipment_update.html",
        context={
            'user': user, 
            'shipment': shipment
        },
        recipient_list=[user.email]
    )
