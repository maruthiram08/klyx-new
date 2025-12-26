from Fundamentals.MoneyControl import MoneyControl
import logging

def check_methods():
    mc = MoneyControl()
    print("--- MoneyControl Methods ---")
    for m in dir(mc):
        if not m.startswith('__'):
            print(m)

if __name__ == "__main__":
    check_methods()
