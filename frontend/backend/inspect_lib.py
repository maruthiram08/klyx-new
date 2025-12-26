from Fundamentals.MoneyControl import MoneyControl
import inspect

def inspect_methods():
    print("--- Source for get_complete_balance_sheet ---")
    try:
        print(inspect.getsource(MoneyControl.get_complete_balance_sheet))
    except Exception as e:
        print(f"Error: {e}")

    print("\n--- Source for get_complete_capital_structure_statement ---")
    try:
        print(inspect.getsource(MoneyControl.get_complete_capital_structure_statement))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_methods()
