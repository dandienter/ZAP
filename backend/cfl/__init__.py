"""
NalarAI - Cognitive Fault Localization (CFL) Package
"""

from .cfl_engine import (
    isolate_first_fault_breakpoint,
    steps_equivalent
)
from .parser import (
    parse_step_to_symbolic,
    _is_plain_algebra,
    _is_safe_latex,
    _has_dangerous_exponents
)
from .classifier import classify_misconception_robust
from .counter_example import synthesize_counter_example
from .guardrail import RobustZeroAnswerGuardrail

__all__ = [
    "isolate_first_fault_breakpoint",
    "steps_equivalent",
    "parse_step_to_symbolic",
    "_is_plain_algebra",
    "_is_safe_latex",
    "_has_dangerous_exponents",
    "classify_misconception_robust",
    "synthesize_counter_example",
    "RobustZeroAnswerGuardrail"
]
