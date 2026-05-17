import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Service class to handle business logic for Tasks.
 */
public class TaskService {
    private final List<Task> tasks = new ArrayList<>();
    private int nextId = 1;

    public void addTask(String title) {
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Task title cannot be empty");
        }
        tasks.add(new Task(nextId++, title));
    }

    public List<Task> getAllTasks() {
        return new ArrayList<>(tasks);
    }

    public boolean toggleTask(int id) {
        Optional<Task> task = tasks.stream().filter(t -> t.getId() == id).findFirst();
        if (task.isPresent()) {
            task.get().setCompleted(!task.get().isCompleted());
            return true;
        }
        return false;
    }

    public boolean deleteTask(int id) {
        return tasks.removeIf(t -> t.getId() == id);
    }
}