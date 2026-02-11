import logging
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

logger = logging.getLogger(__name__)

def send_html_email(subject, template_name, context, recipient_list, from_email=None):
    """
    Send an HTML email using a template.
    
    Args:
        subject (str): Email subject
        template_name (str): Path to the template (e.g. 'emails/otp.html')
        context (dict): Context data for rendering the template
        recipient_list (list): List of recipient email addresses
        from_email (str): Sender email (defaults to settings.DEFAULT_FROM_EMAIL)
    """
    if from_email is None:
        from_email = settings.DEFAULT_FROM_EMAIL

    # Add site_url to context if not present
    if 'site_url' not in context:
        context['site_url'] = getattr(settings, 'SITE_URL', 'http://localhost:3000')

    # Render HTML content
    html_content = render_to_string(template_name, context)
    
    # Create plain text alternative
    text_content = strip_tags(html_content)

    # Send via Celery task
    from users.tasks import send_email_task
    
    send_email_task.delay(
        subject,
        text_content,
        html_content,
        from_email,
        recipient_list
    )
    
    return True
