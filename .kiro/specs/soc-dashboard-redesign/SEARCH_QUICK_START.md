# SEARCH IMPLEMENTATION - QUICK START GUIDE

## For Developers: How to Use the New Search System

### 1. Import the Composable

```javascript
import { useSearch } from '../composables/useSearch'

const {
  performSearch,
  updateFilter,
  filteredLogs,
  paginatedResults,
  currentPage,
  totalPages,
  canNextPage,
  canPrevPage,
  nextPage,
  prevPage
} = useSearch({ pageSize: 50 })
```

### 2. In Template: Search Input

```vue
<input
  :value="searchQuery"
  @input="performSearch($event.target.value)"
  placeholder="Search..."
/>
```

### 3. In Template: Filters

```vue
<!-- Severity Filter -->
<select 
  :value="filters.severity"
  @change="updateFilter('severity', $event.target.value)"
>
  <option value="">All</option>
  <option value="Critical">Critical</option>
  <option value="High">High</option>
  <option value="Medium">Medium</option>
  <option value="Low">Low</option>
</select>

<!-- Log Type Filter -->
<select 
  :value="filters.logType"
  @change="updateFilter('logType', $event.target.value)"
>
  <option value="">All Types</option>
  <option value="Firewall">Firewall</option>
  <option value="IDS">IDS</option>
</select>

<!-- Time Range Filter -->
<select 
  :value="filters.timeRange"
  @change="updateFilter('timeRange', $event.target.value)"
>
  <option value="24h">Last 24 Hours</option>
  <option value="7d">Last 7 Days</option>
  <option value="30d">Last 30 Days</option>
  <option value="all">All Time</option>
</select>
```

### 4. In Template: Display Results

```vue
<!-- Show filtered logs -->
<div v-for="log in paginatedResults" :key="log.id">
  {{ log.source_ip }} → {{ log.dest_ip }}
</div>

<!-- Show pagination -->
<div>
  <button @click="prevPage" :disabled="!canPrevPage">Previous</button>
  <span>{{ currentPage }} / {{ totalPages }}</span>
  <button @click="nextPage" :disabled="!canNextPage">Next</button>
</div>

<!-- Show result count -->
<div>
  Showing {{ paginatedResults.length }} of {{ filteredLogs.length }} results
</div>
```

### 5. In Template: Clear Search

```vue
<button @click="clearAllSearch">Clear All</button>
```

### 6. In Template: Analytics

```vue
<!-- Severity distribution in results -->
<div v-for="(count, severity) in getSeverityCounts" :key="severity">
  {{ severity }}: {{ count }}
</div>

<!-- Top IPs in results -->
<div v-for="ip in getTopSourceIPs" :key="ip.ip">
  {{ ip.ip }}: {{ ip.count }} events
</div>

<!-- Top endpoints in results -->
<div v-for="endpoint in getTopEndpoints" :key="endpoint.name">
  {{ endpoint.name }}: {{ endpoint.count }} events
</div>
```

### 7. In Template: Export

```vue
<button @click="exportAsCSV">Export CSV</button>
<button @click="exportAsJSON">Export JSON</button>
```

---

## Complete Example: LogViewer Page

```vue
<template>
  <div class="space-y-8">
    <!-- Search Bar -->
    <div class="card-glass p-6 rounded-xl">
      <input
        :value="searchQuery"
        @input="performSearch($event.target.value)"
        placeholder="Search logs..."
        class="input-cyber w-full mb-4"
      />
      
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <select 
          :value="filters.severity"
          @change="updateFilter('severity', $event.target.value)"
          class="input-cyber"
        >
          <option value="">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        
        <select 
          :value="filters.logType"
          @change="updateFilter('logType', $event.target.value)"
          class="input-cyber"
        >
          <option value="">All Types</option>
          <option value="Firewall">Firewall</option>
          <option value="IDS">IDS</option>
        </select>
        
        <select 
          :value="filters.timeRange"
          @change="updateFilter('timeRange', $event.target.value)"
          class="input-cyber"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
        
        <button @click="clearAllSearch" class="btn-cyber">Clear</button>
      </div>
    </div>

    <!-- Results Summary -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="stat-card">
        <div class="stat-value">{{ filteredLogs.length }}</div>
        <div class="stat-label">Total Results</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-neon-red">{{ getSeverityCounts.Critical }}</div>
        <div class="stat-label">Critical</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-neon-orange">{{ getSeverityCounts.High }}</div>
        <div class="stat-label">High</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-neon-green">{{ getSeverityCounts.Low }}</div>
        <div class="stat-label">Low</div>
      </div>
    </div>

    <!-- Results Table -->
    <div class="card-glass p-6 rounded-xl">
      <table class="w-full">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Severity</th>
            <th>Source IP</th>
            <th>Destination IP</th>
            <th>Log Type</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in paginatedResults" :key="log.id">
            <td>{{ log.timestamp }}</td>
            <td>{{ log.severity }}</td>
            <td>{{ log.source_ip }}</td>
            <td>{{ log.dest_ip }}</td>
            <td>{{ log.log_type }}</td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="mt-6 flex items-center justify-between">
        <span>Showing {{ paginatedResults.length }} of {{ filteredLogs.length }}</span>
        <div class="flex gap-2">
          <button @click="prevPage" :disabled="!canPrevPage">Previous</button>
          <span>{{ currentPage }} / {{ totalPages }}</span>
          <button @click="nextPage" :disabled="!canNextPage">Next</button>
        </div>
      </div>
    </div>

    <!-- Export -->
    <div class="flex gap-2">
      <button @click="exportAsCSV" class="btn-cyber">Export CSV</button>
      <button @click="exportAsJSON" class="btn-cyber">Export JSON</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAPIStore } from '../stores/apiStore'
import { useSearch } from '../composables/useSearch'

const apiStore = useAPIStore()
const {
  performSearch,
  updateFilter,
  clearAllSearch,
  filteredLogs,
  paginatedResults,
  currentPage,
  totalPages,
  canNextPage,
  canPrevPage,
  nextPage,
  prevPage,
  getSeverityCounts,
  exportAsCSV,
  exportAsJSON,
  searchQuery,
  filters
} = useSearch({ pageSize: 50 })

onMounted(async () => {
  await apiStore.fetchRecentLogs(1000)
})
</script>
```

---

## Key Points

### ✅ DO

- Use `performSearch()` for search input
- Use `updateFilter()` for filter changes
- Use `filteredLogs` for all results
- Use `paginatedResults` for current page
- Use `getSeverityCounts` for analytics
- Use `clearAllSearch()` to reset

### ❌ DON'T

- Don't create local search state
- Don't use `apiStore.logs` directly
- Don't implement custom filtering
- Don't bypass the composable
- Don't change filter order
- Don't search entire JSON

---

## Troubleshooting

### Search not working?
1. Check that you're using `useSearch()` composable
2. Check that you're using `performSearch()` on input
3. Check that `apiStore.logs` is populated
4. Check browser console for errors

### Results not updating?
1. Check that filters are bound correctly
2. Check that `updateFilter()` is called
3. Check that `filteredLogs` is used in template
4. Check that computed properties are reactive

### Pagination not working?
1. Check that `paginatedResults` is used (not `filteredLogs`)
2. Check that `nextPage()` and `prevPage()` are called
3. Check that `canNextPage` and `canPrevPage` are checked
4. Check that page size is set correctly

### Severity counts wrong?
1. Check that logs are normalized
2. Check that `getSeverityCounts` is used
3. Check that severity values are 'Critical', 'High', 'Medium', 'Low'
4. Check that filters are applied correctly

---

## Performance Tips

1. **Use debouncing** - Already built in (300ms default)
2. **Use pagination** - Don't render all results at once
3. **Use computed properties** - They're cached
4. **Use paginatedResults** - Not filteredLogs for display
5. **Export only when needed** - Don't export on every change

---

## Advanced Usage

### Custom Page Size

```javascript
const { setPageSize } = useSearch({ pageSize: 100 })

// Later:
setPageSize(50) // Change to 50 items per page
```

### Custom Debounce

```javascript
const { performSearch } = useSearch({ debounceMs: 500 })
// Search will wait 500ms before filtering
```

### Multiple Filters at Once

```javascript
const { updateFilters } = useSearch()

updateFilters({
  severity: 'Critical',
  logType: 'Firewall',
  timeRange: '7d'
})
```

### Go to Specific Page

```javascript
const { goToPage } = useSearch()

goToPage(5) // Go to page 5
```

---

## Migration Checklist

When migrating a page to use the new search:

- [ ] Import `useSearch` composable
- [ ] Remove local search state (searchQuery, filterSeverity, etc.)
- [ ] Remove local filteredLogs computed property
- [ ] Remove local pagination logic
- [ ] Update template to use composable functions
- [ ] Update template to use composable computed properties
- [ ] Test search functionality
- [ ] Test filters
- [ ] Test pagination
- [ ] Test result counts
- [ ] Test export functionality
- [ ] Test edge cases (empty results, large result sets)

