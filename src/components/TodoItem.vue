<template>
  <li 
  class="todo"
  :class="{
    editing: state.matches('editing'),
    completed
  }"
  :data-todo-state="completed ? 'completed' : 'active'"
  >
    <div class="view">
      <input 
        class="toggle" 
        type="checkbox"
        @change="send('TOGGLE_COMPLETE')"
        :checked="completed"
      />
      <label @dblclick="send('EDIT')">{{title}}</label>
      <button class="destroy" @click="send('DELETE')"></button>
    </div>
    <input 
      class="edit" 
      type="text" 
      :value="title"
      @blur="send('BLUR')"
      @input="send({ type: 'CHANGE', value: $event.target?.value})"
      @keypress.enter="send('COMMIT')"
      @keydown.escape="send('CANCEL')"
      ref="inputRef"
    >
  </li>
</template>

<script lang="ts" setup>
import { computed, ref } from '@vue/reactivity';
import { useActor } from '@xstate/vue';
import { ActorRef } from 'xstate';

const props = defineProps<{
  todoRef: ActorRef<any>
}>()
const {state, send} = useActor(props.todoRef)

const inputRef = ref(null)

const title = computed(() => state.value.context.title)
const completed = computed(() => state.value.context.completed)
</script>