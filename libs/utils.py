"""Collection of functions to make routing easier
"""

from typing import Any

from unidecode import unidecode


def clean_card_name(card_name:str)->str:
    """Cleans a card name to make searches easier

    Args:
        card_name (str): card name to be cleaned

    Returns:
        str: card name, cleaned
    """
    return unidecode(
        card_name.lower()
                 .replace("'", '')
                 .replace('-', ' ')
                 .replace(', ', ' ')
                 .strip()
    )