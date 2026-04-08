<template>
  <div class="page">
    <PageHeader
      :title="`Hey, ${firstName}`"
      subtitle="Here's your fitness snapshot for today."
    />

    <div class="pills-grid">
      <StatPill :value="workoutCount"  label="Workouts Logged" />
      <StatPill :value="mealCount"     label="Meals Today" />
      <StatPill :value="calorieTotal"  label="Calories Today" unit="kcal" />
      <StatPill :value="latestWeight || '—'" label="Latest Weight" :unit="latestWeight ? 'kg' : ''" />
    </div>

    <AppCard title="Recent Workouts">
      <EmptyState v-if="!recentWorkouts.length" message="No workouts logged yet." />
      <table v-else class="data-table">
        <thead><tr><th>Date</th><th>Session</th><th>Category</th><th>Duration</th></tr></thead>
        <tbody>
          <tr v-for="w in recentWorkouts" :key="w.id">
            <td class="mono">{{ w.date }}</td>
            <td class="fw-med">{{ w.name }}</td>
            <td><span class="tag tag-blue">{{ w.category }}</span></td>
            <td>{{ w.duration }} min</td>
          </tr>
        </tbody>
      </table>
      <RouterLink to="/workouts" class="more-link">View all workouts →</RouterLink>
    </AppCard>

    <AppCard title="Today's Meals">
      <EmptyState v-if="!todayMeals.length" message="No meals logged today." />
      <table v-else class="data-table">
        <thead><tr><th>Meal</th><th>Type</th><th>Calories</th><th>Protein</th></tr></thead>
        <tbody>
          <tr v-for="m in todayMeals" :key="m.id">
            <td class="fw-med">{{ m.name }}</td>
            <td>
              <span class="tag" :class="mealTypeTag(m.type)">{{ m.type }}</span>
            </td>
            <td>{{ m.calories }}</td>
            <td>{{ m.protein }}g</td>
          </tr>
        </tbody>
      </table>
      <RouterLink to="/meals" class="more-link">View all meals →</RouterLink>
    </AppCard>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  collection, query, where, orderBy, limit, getDocs
} from 'firebase/firestore'
import { db, COL }        from '@/firebase.js'
import { useAuthStore }   from '@/stores/auth.js'
import PageHeader         from '@/components/PageHeader.vue'
import StatPill           from '@/components/StatPill.vue'
import AppCard            from '@/components/AppCard.vue'
import EmptyState         from '@/components/EmptyState.vue'

const authStore = useAuthStore()

const workouts       = ref([])
const allMeals       = ref([])

const firstName = computed(() => {
  const name = authStore.displayName
  return name ? name.split(' ')[0] : 'there'
})

const todayStr = new Date().toISOString().split('T')[0]

const recentWorkouts = computed(() => [...workouts.value].slice(-3).reverse())

const todayMeals     = computed(() => allMeals.value.filter(m => m.date === todayStr))

const workoutCount   = computed(() => workouts.value.length)
const mealCount      = computed(() => todayMeals.value.length)

const calorieTotal   = computed(() =>
  todayMeals.value.reduce((s, m) => s + (+m.calories || 0), 0)
)

const latestWeight = computed(() => null)

function mealTypeTag(type) {
  return { Breakfast:'tag-yellow', Lunch:'tag-blue', Dinner:'tag-green', Snack:'tag-red' }[type] || 'tag-blue'
}

onMounted(async () => {
  const uid = authStore.uid
  if (!uid) return

  const wq = query(
    collection(db, COL.workouts),
    where('userId', '==', uid),
    orderBy('date', 'desc'),
    limit(5)
  )
  const wSnap = await getDocs(wq)
  workouts.value = wSnap.docs.map(d => ({ id: d.id, ...d.data() }))

  const mq = query(
    collection(db, COL.meals),
    where('userId', '==', uid),
    where('date', '==', todayStr)
  )
  const mSnap = await getDocs(mq)
  allMeals.value = mSnap.docs.map(d => ({ id: d.id, ...d.data() }))
})
</script>

<style scoped>
.page {
  max-width: 960px; margin: 0 auto;
  padding: 3rem 2rem;
}
.pills-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem; margin-bottom: 2rem;
}
.data-table { width: 100%; border-collapse: collapse; }
.data-table th {
  text-align: left; font-size: .7rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: .08em;
  color: var(--muted); padding: .55rem .75rem;
  border-bottom: 1px solid var(--border);
}
.data-table td { padding: .7rem .75rem; font-size: .88rem; border-bottom: 1px solid var(--border); }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: var(--surface2); }
.mono   { font-family: var(--font-mono); font-size: .8rem; }
.fw-med { font-weight: 500; }
.tag {
  display: inline-block; padding: .18rem .55rem; border-radius: 4px;
  font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em;
}
.tag-blue   { background: rgba(71,200,255,.15); color: var(--accent2); }
.tag-yellow { background: rgba(232,255,71,.12); color: var(--accent); }
.tag-green  { background: rgba(74,222,128,.15); color: var(--success); }
.tag-red    { background: rgba(255,92,92,.15);  color: var(--danger); }
.more-link {
  display: inline-block; margin-top: 1rem;
  font-size: .82rem; color: var(--accent2);
  text-decoration: none; transition: opacity .2s;
}
.more-link:hover { opacity: .7; }
@media (max-width: 640px) { .pills-grid { grid-template-columns: 1fr 1fr; } }
</style>
