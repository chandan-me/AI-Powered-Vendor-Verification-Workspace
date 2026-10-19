import re
import logging
import sys

class RedactingFormatter(logging.Formatter):
    """Masks bank account numbers, tokens, and sensitive patterns in logs."""
    
    # Patterns to mask
    PATTERNS = [
        (re.compile(r'(?i)(bank_account|account_number|accountNumber|bank_acc)[\s:=]+["\']?([0-9]{5,20})["\']?'), r'\1="****\2"'),
        (re.compile(r'(?i)(api[_-]?key|token|secret|password)[\s:=]+["\']?([A-Za-z0-9_\-\.]{8,})["\']?'), r'\1="[REDACTED]"'),
    ]

    def format(self, record: logging.LogRecord) -> str:
        original = super().format(record)
        redacted = original
        for pattern, replacement in self.PATTERNS:
            redacted = pattern.sub(replacement, redacted)
        return redacted

def setup_logger(name: str = "vendorverify") -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        formatter = RedactingFormatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    return logger

logger = setup_logger()
