"""Legacy-assessment detection.

Assessments persisted before the 44-feature contract hold the old 20-field
input shape (flat keys such as ``sex`` / ``biomarkers`` / ``systolicBP``). New
records store the nested 11-section contract shape. ``is_legacy_input`` flags
the former so the UI can render them as read-only legacy reports instead of
running (or re-running) a prediction with inputs that do not match the deployed
model.
"""

LEGACY_MARKERS = ("sex", "biomarkers", "hypertensionHistory", "systolicBP")


def is_legacy_input(input_: dict) -> bool:
    """True when the stored input predates the 44-feature contract."""
    if not isinstance(input_, dict):
        return True
    return any(key in input_ for key in LEGACY_MARKERS)