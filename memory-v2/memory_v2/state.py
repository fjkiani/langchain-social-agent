"""Define the state structures for the agent."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class State:
    """The state of the memory graph."""

    original_post: str = ""
    """The original post that the user submitted feedback on"""
    user_response: str = ""
    """The user's feedback on the new post"""
