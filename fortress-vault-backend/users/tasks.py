from celery import shared_task
from django.core.mail import EmailMultiAlternatives
import logging

logger = logging.getLogger(__name__)

@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={'max_retries': 5},
    default_retry_delay=10,
    retry_jitter=True
)
def send_email_task(self, subject, text_content, html_content, from_email, recipient_list):
    """
    Celery task to send emails asynchronously with automatic retries on failure.
    """
    try:
        email = EmailMultiAlternatives(
            subject,
            text_content,
            from_email,
            recipient_list
        )
        if html_content:
            email.attach_alternative(html_content, "text/html")
        email.send()
        logger.info(f"Email sent successfully to {recipient_list}")
        return f"Email sent to {recipient_list}"
    except Exception as e:
        logger.error(f"Error sending email to {recipient_list} (Retry {self.request.retries}/3): {str(e)}")
        raise e
