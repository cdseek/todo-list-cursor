"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Edit2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { db } from "@/lib/firebase"
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  doc, 
  onSnapshot,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore'

interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: Timestamp
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")

  // Fetch todos from Firestore
  useEffect(() => {
    const q = query(collection(db, "todos"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const todosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Todo[]
      setTodos(todosData)
    })

    return () => unsubscribe()
  }, [])

  const addTodo = async () => {
    if (newTodo.trim() !== "") {
      try {
        await addDoc(collection(db, "todos"), {
          text: newTodo,
          completed: false,
          createdAt: Timestamp.now()
        })
        setNewTodo("")
      } catch (error) {
        console.error("Error adding todo:", error)
      }
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      await deleteDoc(doc(db, "todos", id))
    } catch (error) {
      console.error("Error deleting todo:", error)
    }
  }

  const toggleComplete = async (id: string) => {
    const todoToUpdate = todos.find(todo => todo.id === id)
    if (todoToUpdate) {
      try {
        await updateDoc(doc(db, "todos", id), {
          completed: !todoToUpdate.completed
        })
      } catch (error) {
        console.error("Error toggling todo:", error)
      }
    }
  }

  const startEditing = (id: string, text: string) => {
    setEditingId(id)
    setEditText(text)
  }

  const saveEdit = async (id: string) => {
    try {
      await updateDoc(doc(db, "todos", id), {
        text: editText
      })
      setEditingId(null)
    } catch (error) {
      console.error("Error updating todo:", error)
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText("")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground p-4">
        <h1 className="text-2xl font-bold text-center">Todo List App</h1>
      </header>

      <main className="flex-grow container mx-auto p-4">
        <div className="flex mb-4">
          <Input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add a new todo"
            className="flex-grow mr-2"
          />
          <Button onClick={addTodo}>
            <Plus className="w-4 h-4 mr-2" /> Add
          </Button>
        </div>

        <ul className="space-y-2">
          {todos.map((todo) => (
            <li key={todo.id} className="flex items-center bg-card p-2 rounded">
              {editingId === todo.id ? (
                <>
                  <Input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-grow mr-2"
                  />
                  <Button onClick={() => saveEdit(todo.id)} className="mr-2">
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button onClick={cancelEdit} variant="destructive">
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span
                    className={`flex-grow ${todo.completed ? "line-through text-muted-foreground" : ""}`}
                    onClick={() => toggleComplete(todo.id)}
                  >
                    {todo.text}
                  </span>
                  <Button onClick={() => startEditing(todo.id, todo.text)} className="mr-2">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button onClick={() => deleteTodo(todo.id)} variant="destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      </main>

      <footer className="bg-muted text-muted-foreground p-4 text-center">
        <p>&copy; 2023 Todo List App. All rights reserved.</p>
      </footer>
    </div>
  )
}

