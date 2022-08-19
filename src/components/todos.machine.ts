import { nanoid } from 'nanoid';
import { inspect } from '@xstate/inspect';
import { ActorRef, spawn } from 'xstate';
import { createModel } from 'xstate/lib/model';
import { createTodoMachine } from './todoItem.machine';

inspect({
  iframe: false
});

const createTodo = (title: string) => {
  return {
    id: nanoid(),
    title,
    completed: false
  };
};

export interface ITodo {
  id: string;
  title: string;
  completed: boolean;
  ref: ActorRef<any>
}

const todosModel = createModel(
  {
    todo: '',
    todos: [] as ITodo[],
    filter: 'all'
  },
  {
    events: {
      'TODO.COMMIT': (todo: ITodo) => ({ todo }),
      'TODO.DELETE': (id: string) => ({ id }),
      'MARK.completed': () => ({}),
      'MARK.active': () => ({}),
      'NEWTODO.CHANGE': (value: string) => ({ value }),
      'NEWTODO.COMMIT': (value: string) => ({ value }),
      SHOW: (filter: string) => ({ filter }),
      CLEAR_COMPLETED: () => ({})
    }
  }
)

export const todosMachine = todosModel.createMachine({
  id: 'todos',
  initial: 'loading',
  on: {
    'TODO.COMMIT': {
      actions: [
        todosModel.assign({
          todos: (context, event) => {
            return context.todos.map((todo) => {
              return todo.id === event.todo.id
              ? { ...todo, ...event.todo, ref: todo.ref }
              : todo
            })
          }
        })
      ]
    },
    'TODO.DELETE': {
      actions: [
        todosModel.assign({
          todos: (context, event) => {
            return context.todos.filter((todo) => todo.id !== event.id)
          }
        })
      ]
    },
    'MARK.completed': {
      actions: (context) => {
        context.todos.forEach((todo) => todo.ref.send('SET_COMPLETED'))
      }
    },
    'MARK.active': {
      actions: (context) => {
        context.todos.forEach((todo) => todo.ref.send('SET_ACTIVE'))
      }
    },
    'NEWTODO.CHANGE': {
      actions: todosModel.assign({
        todo: (_, event) => event.value
      })
    },
    'NEWTODO.COMMIT': {
      actions: [
        todosModel.assign({
          todo: '',
          todos: (context, event) => {
            const newTodo = createTodo(event.value.trim());
            return context.todos.concat({
              ... newTodo,
              ref: spawn(createTodoMachine(newTodo))
            })
          }
        })
      ],
      cond: (_, event) => !!event.value.trim().length
    },
    SHOW: {
      actions: todosModel.assign({
        filter: (_, event) => event.filter
      })
    },
    CLEAR_COMPLETED: {
      actions: todosModel.assign({
        todos: (context) => context.todos.filter((todo) => !todo.completed)
      })
    }
  },
  states: {
    loading: {
      entry: todosModel.assign({
        todos: (context) => {
          return context.todos.map((todo) => ({
            ... todo,
            ref: spawn(createTodoMachine(todo))
          }))
        }
      }),
      always: 'ready'
    },
    ready: {}
  }
})