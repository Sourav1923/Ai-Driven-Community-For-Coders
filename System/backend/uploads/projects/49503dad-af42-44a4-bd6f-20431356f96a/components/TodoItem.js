const TodoItem = ({ todo, onToggle, onDelete }) => {
  return (
    <div className="todo-item">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      <span className={todo.completed ? 'completed' : ''}>
        {todo.text}
      </span>
      <button onClick={() => onDelete(todo.id)}>Delete</button>
      <style jsx>{`
        .todo-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border: 1px solid #ddd;
          margin-bottom: 10px;
          border-radius: 4px;
        }

        .completed {
          text-decoration: line-through;
          color: #888;
        }
      `}</style>
    </div>
  )
}

export default TodoItem