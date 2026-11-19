"""
Module for sorting arrays in Python.
Created by Knight-Ai.
"""

def sort_array(arr):
    """
    Sorts a list of elements using Python's built-in Timsort algorithm.
    
    Args:
        arr (list): The list to be sorted.
        
    Returns:
        list: A new sorted list.
        
    Raises:
        ValueError: If the input is not a list.
        TypeError: If the list contains incomparable types.
    """
    # Check if input is a list
    if not isinstance(arr, list):
        raise ValueError("Input must be a list.")

    try:
        # sorted() returns a new list, maintaining the original list's integrity
        # It uses Timsort (O(n log n) complexity)
        return sorted(arr)
    except TypeError as e:
        # Handle cases where elements cannot be compared (e.g., strings and integers)
        print(f"Error: Unable to sort the provided list. {e}")
        return None

# Main execution block for testing
if __name__ == "__main__":
    try:
        # Test case 1: Integers
        numbers = [64, 34, 25, 12, 22, 11, 90]
        print(f"Original Numbers: {numbers}")
        print(f"Sorted Numbers:   {sort_array(numbers)}")

        # Test case 2: Strings
        fruits = ["apple", "orange", "banana", "cherry"]
        print(f"\nOriginal Strings: {fruits}")
        print(f"Sorted Strings:   {sort_array(fruits)}")

    except Exception as error:
        print(f"An unexpected error occurred: {error}")