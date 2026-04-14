<template>
  <div class="page">
    <PageHeader title="Body Stats" subtitle="Track your measurements and body composition over time." />

    <div v-if="statEntries.length" class="pills-grid">
      <StatPill :value="latestStat.weight || '—'" label="Latest Weight" unit="kg" />
      <StatPill :value="calcBMI"                  label="BMI" />
      <StatPill :value="latestStat.bodyFat || '—'" label="Body Fat" unit="%" />
      <StatPill :value="statEntries.length"        label="Total Entries" />
    </div>

    <AppCard :title="editingId ? 'Edit Entry' : 'Log New Entry'">
      <div class="row-3">
        <div class="form-group">
          <label>Date</label>
          <input v-model="form.date" type="date" />
        </div>
        <div class="form-group">
          <label>Weight (kg)</label>
          <input v-model="form.weight" type="number" placeholder="0.0" step="0.1" />
        </div>
        <div class="form-group">
          <label>Height (cm)</label>
          <input v-model="form.height" type="number" placeholder="175" />
        </div>
      </div>
      <div class="row-3">
        <div class="form-group">
          <label>Body Fat %</label>
          <input v-model="form.bodyFat" type="number" placeholder="0.0" step="0.1" />
        </div>
        <div class="form-group">
          <label>Muscle Mass (kg)</label>
          <input v-model="form.muscle" type="number" placeholder="0.0" step="0.1" />
        </div>
        <div class="form-group">
          <label>Waist (cm)</label>
          <input v-model="form.waist" type="number" placeholder="0" />
        </div>
      </div>
      <div class="btn-row">
        <button class="btn btn-primary" :disabled="busy" @click="saveEntry">
          {{ editingId ? 'Save Changes' : '+ Add Entry' }}
        </button>
        <button v-if="editingId" class="btn btn-outline" @click="cancelEdit">Cancel</button>
      </div>
    </AppCard>

    <AppCard title="History">
      <div v-if="loading" class="loading-msg">Loading from database…</div>
      <EmptyState v-else-if="!statEntries.length"
                  message="No entries yet — log your first stat above." />
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Date</th><th>Weight</th><th>Height</th><th>BMI</th>
            <th>Body Fat</th><th>Waist</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in [...statEntries].reverse()" :key="e.id">
            <td class="mono">{{ e.date }}</td>
            <td>{{ e.weight }} kg</td>
            <td>{{ e.height }} cm</td>
            <td><span class="tag tag-blue">{{ bmi(e) }}</span></td>
            <td>{{ e.bodyFat }}%</td>
            <td>{{ e.waist }} cm</td>
            <td class="action-cell">
              <button class="btn btn-outline btn-sm" @click="startEdit(e)">Edit</button>
              <button class="btn btn-danger btn-sm" @click="deleteEntry(e.id)">✕</button>
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
import { db, COL }       from '@/firebase.js'
import { useAuthStore }  from '@/stores/auth.js'
import PageHeader        from '@/components/PageHeader.vue'
import StatPill          from '@/components/StatPill.vue'
import AppCard           from '@/components/AppCard.vue'
import EmptyState        from '@/components/EmptyState.vue'

const authStore = useAuthStore()

const statEntries = ref([])
const loading     = ref(false)
const busy        = ref(false)
const editingId   = ref(null)

const form = reactive({
  date: today(), weight: '', height: '', bodyFat: '', muscle: '', waist: ''
})

// ✅ Correct UID
const uid = computed(() => authStore.user?.uid)

const latestStat = computed(() => statEntries.value[statEntries.value.length - 1] || {})
const calcBMI    = computed(() => bmi(latestStat.value))

function bmi(e) {
  if (!e.height || !e.weight) return '—'
  return (e.weight / ((e.height / 100) ** 2)).toFixed(1)
}

async function saveEntry() {
  if (!form.weight || !form.date || !uid.value) return
  busy.value = true

  const payload = {
    userId:    uid.value,
    date:      form.date,
    weight:    Number(form.weight),
    height:    Number(form.height),
    bodyFat:   Number(form.bodyFat),
    muscle:    Number(form.muscle),
    waist:     Number(form.waist),
    updatedAt: serverTimestamp()
  }

  try {
    if (editingId.value) {
      await updateDoc(doc(db, COL.stats, editingId.value), payload)
      const idx = statEntries.value.findIndex(e => e.id === editingId.value)
      if (idx !== -1) statEntries.value[idx] = { id: editingId.value, ...payload }
      editingId.value = null
    } else {
      payload.createdAt = serverTimestamp()
      const ref = await addDoc(collection(db, COL.stats), payload)
      statEntries.value.push({ id: ref.id, ...payload })
    }
    resetForm()
  } catch (err) {
    console.error('saveEntry:', err)
  } finally {
    busy.value = false
  }
}

async function loadEntries() {
  loading.value = true

  try {
    const currentUid = uid.value

    const q = query(
      collection(db, COL.stats),
      orderBy('date', 'asc')
    )

    const snap = await getDocs(q)

    // ✅ filter by user HERE
    statEntries.value = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(e => e.userId === currentUid)

  } catch (err) {
    console.error('loadEntries:', err)
  } finally {
    loading.value = false
  }
}

async function deleteEntry(id) {
  if (!confirm('Delete this entry?')) return
  await deleteDoc(doc(db, COL.stats, id))
  statEntries.value = statEntries.value.filter(e => e.id !== id)
}

function startEdit(entry) {
  Object.assign(form, {
    date: entry.date,
    weight: entry.weight,
    height: entry.height,
    bodyFat: entry.bodyFat,
    muscle: entry.muscle,
    waist: entry.waist
  })
  editingId.value = entry.id
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelEdit() {
  editingId.value = null
  resetForm()
}

function resetForm() {
  Object.assign(form, {
    date: today(),
    weight: '',
    height: '',
    bodyFat: '',
    muscle: '',
    waist: ''
  })
}

function today() {
  return new Date().toISOString().split('T')[0]
}

onMounted(async () => {
  while (!uid.value) {
    await new Promise(r => setTimeout(r, 50))
  }
  await loadEntries()
})
</script>

<style scoped>
.page { max-width: 960px; margin: 0 auto; padding: 3rem 2rem; }

.pills-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem;
}
.form-group  { margin-bottom: 1.1rem; }
.row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
label {
  display: block; font-size: .78rem; font-weight: 500;
  color: var(--muted); text-transform: uppercase; letter-spacing: .06em; margin-bottom: .45rem;
}
input {
  width: 100%; padding: .7rem 1rem;
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 7px; color: var(--text);
  font-family: var(--font-body); font-size: .95rem;
  transition: border-color .2s;
}
input:focus { outline: none; border-color: var(--accent); }
input::placeholder { color: var(--muted); }

.btn-row    { display: flex; gap: .75rem; flex-wrap: wrap; margin-top: .5rem; }
.btn {
  display: inline-flex; align-items: center; gap: .4rem;
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
.btn-danger:hover { opacity: .85; }
.btn-sm      { padding: .3rem .8rem; font-size: .78rem; }
.btn:disabled { opacity: .5; cursor: not-allowed; }

.data-table { width: 100%; border-collapse: collapse; }
.data-table th {
  text-align: left; font-size: .7rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: .08em;
  color: var(--muted); padding: .55rem .75rem; border-bottom: 1px solid var(--border);
}
.data-table td { padding: .7rem .75rem; font-size: .88rem; border-bottom: 1px solid var(--border); }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: var(--surface2); }
.mono   { font-family: var(--font-mono); font-size: .8rem; }
.action-cell { display: flex; gap: .4rem; }
.tag { display: inline-block; padding: .18rem .55rem; border-radius: 4px;
  font-size: .7rem; font-weight: 600; text-transform: uppercase; }
.tag-blue { background: rgba(71,200,255,.15); color: var(--accent2); }
.loading-msg { color: var(--muted); font-size: .88rem; padding: 1rem 0; }

@media (max-width: 640px) {
  .pills-grid { grid-template-columns: 1fr 1fr; }
  .row-3      { grid-template-columns: 1fr; }
}
</style>
