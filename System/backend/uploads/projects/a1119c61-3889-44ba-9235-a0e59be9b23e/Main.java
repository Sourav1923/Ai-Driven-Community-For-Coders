import java.util.Scanner;
import java.util.List;

/**
 * Main entry point for the Java Task Manager CLI.
 */
public class Main {
    private static final TaskService taskService = new TaskService();
    private static final Scanner scanner = new Scanner(System.in);

    public static void main(String[] args) {
        System.out.println("=== Knight-Ai Java Task Manager ===");
        boolean running = true;

        while (running) {
            printMenu();
            String choice = scanner.nextLine();

            try {
                switch (choice) {
                    case "1":
                        viewTasks();
                        break;
                    case "2":
                        addNewTask();
                        break;
                    case "3":
                        toggleTaskStatus();
                        break;
                    case "4":
                        deleteTask();
                        break;
                    case "5":
                        running = false;
                        System.out.println("Exiting... Goodbye!");
                        break;
                    default:
                        System.out.println("Invalid option. Please try again.");
                }
            } catch (Exception e) {
                System.err.println("Error: " + e.getMessage());
            }
        }
        scanner.close();
    }

    private static void printMenu() {
        System.out.println("\n1. View Tasks");
        System.out.println("2. Add Task");
        System.out.println("3. Toggle Task Status");
        System.out.println("4. Delete Task");
        System.out.println("5. Exit");
        System.out.print("Choose an option: ");
    }

    private static void viewTasks() {
        List<Task> tasks = taskService.getAllTasks();
        if (tasks.isEmpty()) {
            System.out.println("No tasks found.");
        } else {
            tasks.forEach(System.out::println);
        }
    }

    private static void addNewTask() {
        System.out.print("Enter task title: ");
        String title = scanner.nextLine();
        taskService.addTask(title);
        System.out.println("Task added successfully.");
    }

    private static void toggleTaskStatus() {
        System.out.print("Enter task ID to toggle: ");
        int id = Integer.parseInt(scanner.nextLine());
        if (taskService.toggleTask(id)) {
            System.out.println("Task status updated.");
        } else {
            System.out.println("Task not found.");
        }
    }

    private static void deleteTask() {
        System.out.print("Enter task ID to delete: ");
        int id = Integer.parseInt(scanner.nextLine());
        if (taskService.deleteTask(id)) {
            System.out.println("Task deleted successfully.");
        } else {
            System.out.println("Task not found.");
        }
    }
}