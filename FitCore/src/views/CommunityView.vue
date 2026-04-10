<template>
  <div class="page">
    <PageHeader
      title="Community"
      subtitle="Share your progress and motivate others. Posts are visible to all members."
    />

    <AppCard title="Share Something">
      <div class="post-type-row">
        <button
          v-for="t in postTypes" :key="t.value"
          class="type-chip"
          :class="{ active: form.type === t.value }"
          @click="form.type = t.value"
        >
          {{ t.label }}
        </button>
      </div>

      <div class="form-group" style="margin-top:1rem">
        <label>Your Post</label>
        <textarea
          v-model="form.body"
          placeholder="Share a PR, a tip, a recipe, or anything fitness related…"
          rows="3"
        ></textarea>
      </div>

      <button class="btn btn-primary" :disabled="busy || !form.body.trim()" @click="submitPost">
        {{ busy ? 'Posting…' : 'Post to Community' }}
      </button>
    </AppCard>

    <div v-if="loading" class="loading-msg">Loading community feed…</div>
    <EmptyState v-else-if="!posts.length"
                message="No posts yet — be the first to share!" />

    <div v-else class="feed">
      <div v-for="p in posts" :key="p.id" class="post-card">
        <div class="post-header">
          <div class="post-avatar">{{ initials(p.authorName) }}</div>
          <div class="post-meta">
            <span class="post-author">{{ p.authorName }}</span>
            <span class="post-time">{{ formatDate(p.createdAt) }}</span>
          </div>
          <span class="tag" :class="typeTag(p.type)">{{ p.type }}</span>
          <button
            v-if="p.authorId === authStore.uid"
            class="btn btn-danger btn-sm delete-post"
            @click="deletePost(p.id)"
          >✕</button>
        </div>

        <p class="post-body">{{ p.body }}</p>

        <div class="post-footer">
          <button class="react-btn" @click="toggleLike(p)">
            {{ p.likedBy?.includes(authStore.uid) ? '♥' : '♡' }}
            {{ p.likedBy?.length || 0 }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import {
  collection, query, orderBy, limit,
  getDocs, addDoc, deleteDoc, updateDoc,
  doc, serverTimestamp, arrayUnion, arrayRemove
} from 'firebase/firestore'
import { db, COL }      from '@/firebase.js'
import { useAuthStore } from '@/stores/auth.js'
import PageHeader       from '@/components/PageHeader.vue'
import AppCard          from '@/components/AppCard.vue'
import EmptyState       from '@/components/EmptyState.vue'

const authStore = useAuthStore()

const posts   = ref([])
const loading = ref(false)
const busy    = ref(false)

const postTypes = [
  { value: 'Progress',   label: 'Progress'   },
  { value: 'PR',         label: 'PR'         },
  { value: 'Tip',        label: 'Tip'        },
  { value: 'Recipe',     label: 'Recipe'     },
  { value: 'Motivation', label: 'Motivation' }
]

const form = reactive({ body: '', type: 'Progress' })

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

function typeTag(type) {
  return {
    Progress:   'tag-blue',
    PR:         'tag-yellow',
    Tip:        'tag-green',
    Recipe:     'tag-green',
    Motivation: 'tag-red'
  }[type] || 'tag-blue'
}

function formatDate(ts) {
  if (!ts) return ''
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function submitPost() {
  if (!form.body.trim()) return
  busy.value = true
  try {
    const payload = {
      authorId:   authStore.uid,
      authorName: authStore.displayName,
      body:       form.body.trim(),
      type:       form.type,
      likedBy:    [],
      createdAt:  serverTimestamp()
    }
    const ref = await addDoc(collection(db, COL.community), payload)
    posts.value.unshift({ id: ref.id, ...payload, createdAt: new Date() })
    form.body = ''
  } catch (err) {
    console.error('submitPost:', err)
  } finally {
    busy.value = false
  }
}

async function loadPosts() {
  loading.value = true
  try {
    const q = query(
      collection(db, COL.community),
      orderBy('createdAt', 'desc'),
      limit(50)
    )
    const snap = await getDocs(q)
    posts.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.error('loadPosts:', err)
  } finally {
    loading.value = false
  }
}

async function deletePost(id) {
  if (!confirm('Delete this post?')) return
  await deleteDoc(doc(db, COL.community, id))
  posts.value = posts.value.filter(p => p.id !== id)
}

async function toggleLike(post) {
  const uid      = authStore.uid
  const hasLiked = post.likedBy?.includes(uid)
  const ref      = doc(db, COL.community, post.id)
  try {
    await updateDoc(ref, {
      likedBy: hasLiked ? arrayRemove(uid) : arrayUnion(uid)
    })
    if (hasLiked) {
      post.likedBy = post.likedBy.filter(id => id !== uid)
    } else {
      post.likedBy = [...(post.likedBy || []), uid]
    }
  } catch (err) {
    console.error('toggleLike:', err)
  }
}

onMounted(loadPosts)
</script>

<style scoped>
.page { max-width: 760px; margin: 0 auto; padding: 3rem 2rem; }

.post-type-row {
  display: flex; gap: .5rem; flex-wrap: wrap;
}
.type-chip {
  padding: .4rem 1rem; border-radius: 20px;
  border: 1px solid var(--border);
  background: transparent; color: var(--muted);
  font-family: var(--font-body); font-size: .82rem; font-weight: 500;
  cursor: pointer; transition: all .18s;
}
.type-chip:hover { border-color: var(--accent2); color: var(--accent2); }
.type-chip.active {
  background: var(--accent); border-color: var(--accent);
  color: var(--bg); font-weight: 700;
}

.form-group { margin-bottom: 1rem; }
label {
  display: block; font-size: .78rem; font-weight: 500;
  color: var(--muted); text-transform: uppercase; letter-spacing: .06em;
  margin-bottom: .45rem;
}
textarea {
  width: 100%; padding: .75rem 1rem;
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 7px; color: var(--text);
  font-family: var(--font-body); font-size: .95rem;
  resize: vertical; transition: border-color .2s;
}
textarea:focus { outline: none; border-color: var(--accent); }
textarea::placeholder { color: var(--muted); }

.btn {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .6rem 1.4rem; border-radius: 7px; border: none;
  font-family: var(--font-body); font-size: .88rem; font-weight: 600;
  cursor: pointer; transition: opacity .15s, transform .1s;
}
.btn:active   { transform: scale(.97); }
.btn-primary  { background: var(--accent); color: var(--bg); }
.btn-primary:hover { opacity: .88; }
.btn-danger   { background: var(--danger); color: #fff; }
.btn-sm       { padding: .3rem .8rem; font-size: .78rem; }
.btn:disabled { opacity: .5; cursor: not-allowed; }

.feed { display: flex; flex-direction: column; gap: 1rem; }

.post-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.4rem 1.6rem;
  transition: border-color .2s;
}
.post-card:hover { border-color: var(--border); }

.post-header {
  display: flex; align-items: center; gap: .75rem;
  margin-bottom: .9rem; flex-wrap: wrap;
}

.post-avatar {
  width: 38px; height: 38px; border-radius: 50%;
  background: var(--accent2); color: var(--bg);
  font-size: .78rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.post-meta     { flex: 1; display: flex; flex-direction: column; gap: .1rem; }
.post-author   { font-weight: 600; font-size: .92rem; }
.post-time     { font-size: .75rem; color: var(--muted); font-family: var(--font-mono); }
.delete-post   { margin-left: auto; }

.post-body {
  font-size: .95rem; line-height: 1.65;
  color: var(--text); margin-bottom: 1rem;
  white-space: pre-wrap;
}

.post-footer { display: flex; gap: 1rem; }

.react-btn {
  background: none; border: 1px solid var(--border);
  border-radius: 20px; padding: .3rem .75rem;
  font-size: .82rem; cursor: pointer; color: var(--text);
  transition: border-color .18s, background .18s;
}
.react-btn:hover { border-color: var(--danger); background: rgba(255,92,92,.08); }

.tag {
  display: inline-block; padding: .18rem .55rem; border-radius: 4px;
  font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em;
}
.tag-blue   { background: rgba(71,200,255,.15); color: var(--accent2); }
.tag-yellow { background: rgba(232,255,71,.12); color: var(--accent); }
.tag-green  { background: rgba(74,222,128,.15); color: var(--success); }
.tag-red    { background: rgba(255,92,92,.15);  color: var(--danger); }

.loading-msg { color: var(--muted); font-size: .88rem; padding: 1rem 0; }

@media (max-width: 480px) {
  .page { padding: 2rem 1rem; }
  .post-card { padding: 1rem; }
}
</style>
