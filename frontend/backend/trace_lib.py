import Fundamentals
import os
import sys

# Force load
from Fundamentals.MoneyControl import MoneyControl

if hasattr(Fundamentals, '__file__'):
    print(f"Package: {os.path.dirname(Fundamentals.__file__)}")
else:
    # If it's a namespace package or similar
    print(f"Path: {Fundamentals.__path__}")
