<template>
  <div class="page">
    <PageHeader title="Meal Records" subtitle="Log your meals and track your daily nutrition." />

    <!-- Today's macro summary pills -->
    <div v-if="todayMeals.length" class="pills-grid">
      <StatPill :value="todayTotals.calories" label="Calories Today" unit="kcal" />
      <StatPill :value="todayTotals.protein"  label="Protein"        unit="g" />
      <StatPill :value="todayTotals.carbs"    label="Carbs"          unit="g" />
      <StatPill :value="todayTotals.fat"      label="Fat"            unit="g" />
    </div>

    <AppCard :title="editingId ? 'Edit Meal' : 'Log a Meal'">
      <div class="row-2">
        <div class="form-group">
          <label>Meal Name</label>
          <input v-model="form.name" placeholder="e.g. Chicken & Rice" />
        </div>
        <div class="form-group">
          <label>Meal Type</label>
          <select v-model="form.type">
            <option>Breakfast</option>
            <option>Lunch</option>
            <option>Dinner</option>
            <option>Snack</option>
          </select>
        </div>
      </div>
      <div class="row-4">
        <div class="form-group">
          <label>Calories</label>
          <input v-model="form.calories" type="number" placeholder="0" />
        </div>
        <div class="form-group">
          <label>Protein (g)</label>
          <input v-model="form.protein" type="number" placeholder="0" />
        </div>
        <div class="form-group">
          <label>Carbs (g)</label>
          <input v-model="form.carbs" type="number" placeholder="0" />
        </div>
        <div class="form-group">
          <label>Fat (g)</label>
          <input v-model="form.fat" type="number" placeholder="0" />
        </div>
      </div>
      <div class="form-group" style="max-width:240px">
        <label>Date</label>
        <input v-model="form.date" type="date" />
      </div>
      <div class="btn-row">
        <button class="btn btn-primary" :disabled="busy" @click="saveMeal">
          {{ editingId ? 'Save Changes' : '+ Log Meal' }}
        </button>
        <button v-if="editingId" class="btn btn-outline" @click="cancelEdit">Cancel</button>
      </div>
    </AppCard>

    <AppCard title="Meal Log">
      <div v-if="loading" class="loading-msg">Loading from database…</div>
      <EmptyState v-else-if="!meals.length"
                  message="No meals logged yet — add your first meal above." />
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Date</th><th>Meal</th><th>Type</th>
            <th>Cal</th><th>Protein</th><th>Carbs</th><th>Fat</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in [...meals].reverse()" :key="m.id">
            <td class="mono">{{ m.date }}</td>
            <td class="fw-med">{{ m.name }}</td>
            <td>
              <span class="tag" :class="typeTag(m.type)">{{ m.type }}</span>
            </td>
            <td>{{ m.calories }}</td>
            <td>{{ m.protein }}g</td>
            <td>{{ m.carbs }}g</td>
            <td>{{ m.fat }}g</td>
            <td class="action-cell">
              <button class="btn btn-outline btn-sm" @click="startEdit(m)">Edit</button>
              <button class="btn btn-danger  btn-sm" @click="deleteMeal(m.id)">✕</button>
            </td>
          </tr>
        </tbody>
      </table>
    </AppCard>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
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

const meals     = ref([])
const loading   = ref(false)
const busy      = ref(false)
const editingId = ref(null)

const form = reactive({
  name: '', type: 'Breakfast', calories: '', protein: '', carbs: '', fat: '',
  date: today()
})

const todayStr  = new Date().toISOString().split('T')[0]
const todayMeals = computed(() => meals.value.filter(m => m.date === todayStr))
const todayTotals = computed(() => todayMeals.value.reduce((a, m) => ({
  calories: a.calories + (+m.calories || 0),
  protein:  a.protein  + (+m.protein  || 0),
  carbs:    a.carbs    + (+m.carbs    || 0),
  fat:      a.fat      + (+m.fat      || 0)
}), { calories: 0, protein: 0, carbs: 0, fat: 0 }))

function typeTag(type) {
  return { Breakfast:'tag-yellow', Lunch:'tag-blue', Dinner:'tag-green', Snack:'tag-red' }[type] || 'tag-blue'
}

async function saveMeal() {
  if (!form.name) return
  busy.value = true
  const payload = {
    userId:    authStore.uid,
    name:      form.name,
    type:      form.type,
    calories:  Number(form.calories),
    protein:   Number(form.protein),
    carbs:     Number(form.carbs),
    fat:       Number(form.fat),
    date:      form.date,
    updatedAt: serverTimestamp()
  }
  try {
    if (editingId.value) {
      await updateDoc(doc(db, COL.meals, editingId.value), payload)
      const idx = meals.value.findIndex(m => m.id === editingId.value)
      if (idx !== -1) meals.value[idx] = { id: editingId.value, ...payload }
      editingId.value = null
    } else {
      payload.createdAt = serverTimestamp()
      const ref = await addDoc(collection(db, COL.meals), payload)
      meals.value.push({ id: ref.id, ...payload })
    }
    resetForm()
  } catch (err) { console.error('saveMeal:', err) }
  finally { busy.value = false }
}

async function loadMeals() {
  loading.value = true
  try {
    const q = query(
      collection(db, COL.meals),
      where('userId', '==', authStore.uid),
      orderBy('date', 'asc')
    )
    const snap = await getDocs(q)
    meals.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (err) { console.error('loadMeals:', err) }
  finally { loading.value = false }
}

async function deleteMeal(id) {
  if (!confirm('Delete this meal?')) return
  await deleteDoc(doc(db, COL.meals, id))
  meals.value = meals.value.filter(m => m.id !== id)
}

function startEdit(m) {
  Object.assign(form, { name:m.name, type:m.type, calories:m.calories,
    protein:m.protein, carbs:m.carbs, fat:m.fat, date:m.date })
  editingId.value = m.id
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function cancelEdit() { editingId.value = null; resetForm() }
function resetForm() {
  Object.assign(form, { name:'', type:'Breakfast', calories:'', protein:'', carbs:'', fat:'', date:today() })
}
function today() { return new Date().toISOString().split('T')[0] }

onMounted(loadMeals)
</script>

<style scoped>
.page        { max-width: 960px; margin: 0 auto; padding: 3rem 2rem; }
.pills-grid  { display: grid; grid-template-columns: repeat(4,1fr); gap:1rem; margin-bottom:2rem; }
.row-2       { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.row-4       { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; }
.form-group  { margin-bottom: 1.1rem; }
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
.btn-row { display: flex; gap: .75rem; flex-wrap: wrap; margin-top: .5rem; }
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
.data-table { width: 100%; border-collapse: collapse; }
.data-table th {
  text-align: left; font-size: .7rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: .08em; color: var(--muted); padding: .55rem .75rem; border-bottom: 1px solid var(--border);
}
.data-table td { padding: .7rem .75rem; font-size: .88rem; border-bottom: 1px solid var(--border); }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: var(--surface2); }
.mono    { font-family: var(--font-mono); font-size: .8rem; }
.fw-med  { font-weight: 500; }
.action-cell { display: flex; gap: .4rem; }
.tag { display: inline-block; padding: .18rem .55rem; border-radius: 4px;
       font-size: .7rem; font-weight: 600; text-transform: uppercase; }
.tag-yellow { background: rgba(232,255,71,.12); color: var(--accent); }
.tag-blue   { background: rgba(71,200,255,.15); color: var(--accent2); }
.tag-green  { background: rgba(74,222,128,.15); color: var(--success); }
.tag-red    { background: rgba(255,92,92,.15);  color: var(--danger); }
.loading-msg { color: var(--muted); font-size: .88rem; padding: 1rem 0; }
@media (max-width:640px) {
  .pills-grid { grid-template-columns: 1fr 1fr; }
  .row-2, .row-4 { grid-template-columns: 1fr; }
}
</style>
