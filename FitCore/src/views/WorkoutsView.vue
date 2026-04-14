<template>
  <div class="page">
    <PageHeader title="Workouts" subtitle="Build and log your training sessions." />
    
    <!-- Summary pills -->
    <div v-if="workouts.length" class="pills-grid">
      <StatPill :value="workouts.length"  label="Sessions" />
      <StatPill :value="totalExercises"   label="Exercises" />
      <StatPill :value="totalVolume"      label="Total Volume" unit="kg" />
      <StatPill :value="avgDuration"      label="Avg Duration" unit="min" />
    </div>

    <AppCard :title="editingId ? 'Edit Session' : 'Log New Session'">
      <div class="row-2">
        <div class="form-group">
          <label>Session Name</label>
          <input v-model="form.name" placeholder="e.g. Push Day A" />
        </div>
        <div class="form-group">
          <label>Date</label>
          <input v-model="form.date" type="date" />
        </div>
      </div>
      <div class="row-2">
        <div class="form-group">
          <label>Category</label>
          <select v-model="form.category">
            <option>Strength</option>
            <option>Cardio</option>
            <option>HIIT</option>
            <option>Flexibility</option>
            <option>Sport</option>
          </select>
        </div>
        <div class="form-group">
          <label>Duration (min)</label>
          <input v-model="form.duration" type="number" placeholder="60" />
        </div>
      </div>

      <p class="section-label">Exercises</p>
      <div v-for="(ex, idx) in form.exercises" :key="idx" class="exercise-row">
        <input v-model="ex.name"   placeholder="Exercise name" class="ex-name" />
        <input v-model="ex.sets"   type="number" placeholder="Sets"   class="ex-num" />
        <input v-model="ex.reps"   type="number" placeholder="Reps"   class="ex-num" />
        <input v-model="ex.weight" type="number" placeholder="kg"     class="ex-num" />
        <button class="btn btn-danger btn-sm"
                @click="form.exercises.splice(idx, 1)">✕</button>
      </div>

      <div class="btn-row">
        <button class="btn btn-outline btn-sm"
                @click="form.exercises.push({name:'',sets:'',reps:'',weight:''})">
          + Add Exercise
        </button>
        <button class="btn btn-primary" :disabled="busy" @click="saveWorkout">
          {{ editingId ? 'Save Changes' : 'Save Session' }}
        </button>
        <button v-if="editingId" class="btn btn-outline" @click="cancelEdit">Cancel</button>
      </div>
    </AppCard>

    <div v-if="loading" class="loading-msg">Loading from database…</div>
    <EmptyState v-else-if="!workouts.length"
                message="No workouts yet — log your first session above." />

    <AppCard v-for="w in [...workouts].reverse()" :key="w.id">
      <template #header>
        <div class="session-header">
          <div>
            <span class="session-name">{{ w.name }}</span>
            <div class="session-meta">
              <span class="mono-sm">{{ w.date }}</span>
              <span class="tag tag-blue">{{ w.category }}</span>
              <span class="tag tag-yellow">{{ w.duration }} min</span>
            </div>
          </div>
          <div class="action-cell">
            <button class="btn btn-outline btn-sm" @click="startEdit(w)">Edit</button>
            <button class="btn btn-danger  btn-sm" @click="deleteWorkout(w.id)">✕</button>
          </div>
        </div>
      </template>

      <table v-if="w.exercises && w.exercises.length" class="data-table">
        <thead>
          <tr><th>Exercise</th><th>Sets</th><th>Reps</th><th>Weight</th><th>Volume</th></tr>
        </thead>
        <tbody>
          <tr v-for="(e, ei) in w.exercises" :key="ei">
            <td class="fw-med">{{ e.name }}</td>
            <td>{{ e.sets }}</td>
            <td>{{ e.reps }}</td>
            <td>{{ e.weight }} kg</td>
            <td>
              <span class="tag tag-green">
                {{ (e.sets * e.reps * e.weight) || 0 }} kg
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="no-exercises">No exercises recorded.</p>
    </AppCard>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  collection, query, where, orderBy,
  getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore'
import { db, COL }      from '@/firebase.js'
import { useAuthStore } from '@/stores/auth.js'
import PageHeader       from '@/components/PageHeader.vue'
import StatPill         from '@/components/StatPill.vue'
import AppCard          from '@/components/AppCard.vue'
import EmptyState       from '@/components/EmptyState.vue'

const authStore = useAuthStore()
const route = useRoute()

const workouts  = ref([])
const loading   = ref(false)
const busy      = ref(false)
const editingId = ref(null)

const form = reactive({
  name: '', date: today(), category: 'Strength', duration: '',
  exercises: [{ name: '', sets: '', reps: '', weight: '' }]
})

const totalExercises = computed(() =>
  workouts.value.reduce((a, w) => a + (w.exercises?.length || 0), 0)
)

const totalVolume = computed(() =>
  workouts.value.reduce((a, w) =>
    a + (w.exercises || []).reduce((b, e) =>
      b + ((+e.sets||0) * (+e.reps||0) * (+e.weight||0)), 0), 0)
)

const avgDuration = computed(() => {
  if (!workouts.value.length) return 0
  const total = workouts.value.reduce((a, w) => a + (+w.duration || 0), 0)
  return Math.round(total / workouts.value.length)
})

async function loadWorkouts() {
  if (!authStore.uid) return

  loading.value = true
  try {
    const q = query(
      collection(db, COL.workouts),
      where('userId', '==', authStore.uid),
      orderBy('date', 'asc')
    )
    const snap = await getDocs(q)
    workouts.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.error('loadWorkouts:', err)
  } finally {
    loading.value = false
  }
}

// 🔥 FIX 1: load when user logs in
watch(
  () => authStore.uid,
  (uid) => {
    if (uid) loadWorkouts()
  },
  { immediate: true }
)

// 🔥 FIX 2: reload when page is accessed again
watch(
  () => route.fullPath,
  () => {
    if (authStore.uid) loadWorkouts()
  }
)

async function saveWorkout() {
  if (!form.name) return
  busy.value = true

  const exercises = form.exercises
    .filter(e => e.name)
    .map(e => ({ name:e.name, sets:+e.sets, reps:+e.reps, weight:+e.weight }))

  const payload = {
    userId: authStore.uid,
    name: form.name,
    date: form.date,
    category: form.category,
    duration: Number(form.duration),
    exercises,
    updatedAt: serverTimestamp()
  }

  try {
    if (editingId.value) {
      await updateDoc(doc(db, COL.workouts, editingId.value), payload)
      const idx = workouts.value.findIndex(w => w.id === editingId.value)
      if (idx !== -1) workouts.value[idx] = { id: editingId.value, ...payload }
      editingId.value = null
    } else {
      payload.createdAt = serverTimestamp()
      const ref = await addDoc(collection(db, COL.workouts), payload)
      workouts.value.push({ id: ref.id, ...payload })
    }
    resetForm()
  } catch (err) {
    console.error('saveWorkout:', err)
  } finally {
    busy.value = false
  }
}

async function deleteWorkout(id) {
  if (!confirm('Delete this workout session?')) return
  await deleteDoc(doc(db, COL.workouts, id))
  workouts.value = workouts.value.filter(w => w.id !== id)
}

function startEdit(w) {
  Object.assign(form, {
    name: w.name,
    date: w.date,
    category: w.category,
    duration: w.duration,
    exercises: w.exercises.map(e => ({ ...e }))
  })
  editingId.value = w.id
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelEdit() {
  editingId.value = null
  resetForm()
}

function resetForm() {
  Object.assign(form, {
    name: '',
    date: today(),
    category: 'Strength',
    duration: ''
  })
  form.exercises = [{ name:'', sets:'', reps:'', weight:'' }]
}

function today() {
  return new Date().toISOString().split('T')[0]
}
</script>


<style scoped>
.page { max-width: 960px; margin: 0 auto; padding: 3rem 2rem; }
.pills-grid { display: grid; grid-template-columns: repeat(4,1fr); gap:1rem; margin-bottom:2rem; }
.row-2      { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { margin-bottom: 1.1rem; }
label {
  display: block; font-size: .78rem; font-weight: 500;
  color: var(--muted); text-transform: uppercase; letter-spacing: .06em; margin-bottom: .45rem;
}
input, select {
  width: 100%; padding: .7rem 1rem;
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 7px; color: var(--text);
  font-family: var(--font-body); font-size: .95rem; transition: border-color .2s;
}
input:focus, select:focus { outline: none; border-color: var(--accent); }
input::placeholder { color: var(--muted); }
.section-label {
  font-size: .7rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .1em; color: var(--muted); margin: .75rem 0 .6rem;
}
/* Exercise builder row: name stretches, number inputs are fixed width */
.exercise-row {
  display: grid;
  grid-template-columns: 1fr 80px 80px 80px auto;
  gap: .6rem; align-items: center; margin-bottom: .6rem;
}
.ex-num { width: 80px; }
.btn-row { display: flex; gap: .75rem; flex-wrap: wrap; margin-top: .75rem; }
.btn {
  display: inline-flex; align-items: center; gap:.4rem;
  padding: .6rem 1.4rem; border-radius: 7px; border: none;
  font-family: var(--font-body); font-size: .88rem; font-weight: 600;
  cursor: pointer; transition: opacity .15s, transform .1s;
}
.btn:active  { transform: scale(.97); }
.btn-primary { background: var(--accent); color: var(--bg); }
.btn-primary:hover { opacity: .88; }
.btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text); }
.btn-outline:hover { border-color: var(--accent); color: var(--accent); }
.btn-danger  { background: var(--danger); color: #fff; }
.btn-sm      { padding: .3rem .8rem; font-size: .78rem; }
.btn:disabled { opacity:.5; cursor:not-allowed; }
.session-header { display: flex; justify-content: space-between; align-items: flex-start; width: 100%; }
.session-name   { font-size: 1.05rem; font-weight: 600; display: block; margin-bottom: .35rem; }
.session-meta   { display: flex; gap: .5rem; align-items: center; flex-wrap: wrap; }
.mono-sm        { font-family: var(--font-mono); font-size: .78rem; color: var(--muted); }
.action-cell    { display: flex; gap: .4rem; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th {
  text-align: left; font-size: .7rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: .08em; color: var(--muted); padding: .55rem .75rem; border-bottom: 1px solid var(--border);
}
.data-table td { padding: .7rem .75rem; font-size: .88rem; border-bottom: 1px solid var(--border); }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: var(--surface2); }
.fw-med { font-weight: 500; }
.tag { display: inline-block; padding: .18rem .55rem; border-radius: 4px;
       font-size: .7rem; font-weight: 600; text-transform: uppercase; }
.tag-blue   { background: rgba(71,200,255,.15); color: var(--accent2); }
.tag-yellow { background: rgba(232,255,71,.12); color: var(--accent); }
.tag-green  { background: rgba(74,222,128,.15); color: var(--success); }
.no-exercises { color: var(--muted); font-size: .85rem; }
.loading-msg  { color: var(--muted); font-size: .88rem; padding: 1rem 0; }
@media (max-width:640px) {
  .pills-grid  { grid-template-columns: 1fr 1fr; }
  .row-2       { grid-template-columns: 1fr; }
  .exercise-row { grid-template-columns: 1fr auto; }
  .ex-num { width: 60px; }
}
</style>
