class ModernTable {
    constructor(selector, options) {
        this.container = document.querySelector(selector);
        if (!this.container) {
            console.error(`ModernTable: Container ${selector} not found.`);
            return;
        }

        this.options = {
            data: [],
            columns: [],
            searchPlaceholder: 'Search something...',
            pageSize: 10,
            pageSizeOptions: [5, 10, 20, 50],
            showSearch: true,
            showColumns: true,
            pagination: true,
            filters: [], // { field, title, options }
            ...options
        };

        this.state = {
            data: [...this.options.data],
            filteredData: [...this.options.data],
            sortKey: null,
            sortOrder: 'asc',
            currentPage: 1,
            searchQuery: '',
            hiddenColumns: new Set(),
            activeFilters: {}, // { field: Set(values) }
            pageSize: this.options.pageSize
        };

        // Initialize state for filters
        this.options.filters.forEach(f => {
            this.state.activeFilters[f.field] = new Set();
        });

        this.init();
    }

    init() {
        this.container.classList.add('mt-container');

        // Create Persistent Elements
        this.dom = {
            controls: document.createElement('div'),
            chips: document.createElement('div'),
            tableWrapper: document.createElement('div'),
            pagination: document.createElement('div')
        };

        this.dom.controls.className = 'mt-controls';
        this.dom.chips.className = 'mt-filter-chips';
        this.dom.tableWrapper.className = 'mt-table-wrapper';

        this.container.appendChild(this.dom.controls);
        this.container.appendChild(this.dom.chips);
        this.container.appendChild(this.dom.tableWrapper);
        this.container.appendChild(this.dom.pagination);

        // Initial build of controls (Search input etc.)
        this.renderControls();

        this.filterData();
        this.render();
    }

    render() {
        // 1. Update Controls State (e.g. Filter counts)
        this.updateControlsState();

        // 2. Filter Chips
        this.renderFilterChips();

        // 3. Table
        this.dom.tableWrapper.innerHTML = '';
        const table = document.createElement('table');
        table.className = 'mt-table';
        table.appendChild(this.createHeader());
        table.appendChild(this.createBody());
        this.dom.tableWrapper.appendChild(table);

        // 4. Pagination
        this.renderPagination();
    }

    updateControlsState() {
        // Update Filter Counts
        this.options.filters.forEach(filter => {
            const btn = this.dom.controls.querySelector(`.mt-filter-btn[data-field="${filter.field}"]`);
            if (btn) {
                const count = this.state.activeFilters[filter.field].size;
                btn.innerHTML = `
                    ${filter.title} ${count > 0 ? `(${count})` : ''}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                `;
            }
        });
    }

    renderControls() {
        this.dom.controls.innerHTML = '';

        const left = document.createElement('div');
        left.className = 'mt-controls-left';

        // Search
        if (this.options.showSearch) {
            const searchWrapper = document.createElement('div');
            searchWrapper.className = 'mt-search-wrapper';
            searchWrapper.setAttribute('style', 'display: flex; align-items: center; position: relative;');
            searchWrapper.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="position: absolute; left: 10px;" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z"/></svg>
            `;
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = this.options.searchPlaceholder;
            searchInput.className = 'mt-input';
            searchInput.setAttribute('style', 'padding-left: 35px;');
            searchInput.value = this.state.searchQuery;

            searchWrapper.appendChild(searchInput);

            const debouncedSearch = this.debounce((val) => this.handleSearch(val), 300);
            searchInput.addEventListener('input', (e) => debouncedSearch(e.target.value));
            left.appendChild(searchWrapper);
        }

        this.dom.controls.appendChild(left);

        const right = document.createElement('div');
        right.className = 'mt-controls-right';

        // Custom Filters
        this.options.filters.forEach(filter => {
            right.appendChild(this.createFilterDropdown(filter));
        });

        // Columns
        if (this.options.showColumns) {
            right.appendChild(this.createColumnsDropdown());
        }

        this.dom.controls.appendChild(right);
    }

    renderFilterChips() {
        this.dom.chips.innerHTML = '';
        const chipsNode = this.createFilterChips();
        if (chipsNode) {
            this.dom.chips.appendChild(chipsNode);
            this.dom.chips.style.display = 'flex';
        } else {
            this.dom.chips.style.display = 'none';
        }
    }
    renderPagination() {
        this.dom.pagination.innerHTML = '';
        if (this.options.pagination) {
            const pagArea = this.createPaginationArea();
            this.dom.pagination.appendChild(pagArea);
        } else {
            this.dom.pagination.style.display = 'none';
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    createFilterDropdown(filter) {
        const dropdown = document.createElement('div');
        dropdown.className = 'mt-dropdown';

        const count = this.state.activeFilters[filter.field].size;
        const btn = document.createElement('button');
        btn.className = 'mt-btn mt-filter-btn';
        btn.setAttribute('data-field', filter.field);
        btn.innerHTML = `
            ${filter.title} ${count > 0 ? `(${count})` : ''}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        `;

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeAllDropdowns(dropdown);
            dropdown.classList.toggle('active');
        });

        const content = document.createElement('div');
        content.className = 'mt-dropdown-content';

        filter.options.forEach(opt => {
            const label = document.createElement('label');
            label.className = 'mt-dropdown-item';

            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = this.state.activeFilters[filter.field].has(opt);
            cb.addEventListener('change', () => this.handleFilterToggle(filter.field, opt));

            label.appendChild(cb);
            label.appendChild(document.createTextNode(opt));
            content.appendChild(label);
        });

        dropdown.appendChild(btn);
        dropdown.appendChild(content);

        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) dropdown.classList.remove('active');
        });

        return dropdown;
    }

    createColumnsDropdown() {
        const dropdown = document.createElement('div');
        dropdown.className = 'mt-dropdown';

        const btn = document.createElement('button');
        btn.className = 'mt-btn';
        btn.innerHTML = `
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"></path></svg>
            Columns
        `;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeAllDropdowns(dropdown);
            dropdown.classList.toggle('active');
        });

        const content = document.createElement('div');
        content.className = 'mt-dropdown-content';

        this.options.columns.forEach(col => {
            const item = document.createElement('label');
            item.className = 'mt-dropdown-item';

            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = !this.state.hiddenColumns.has(col.field);
            cb.addEventListener('change', () => this.toggleColumn(col.field));

            item.appendChild(cb);
            item.appendChild(document.createTextNode(col.title));
            content.appendChild(item);
        });

        dropdown.appendChild(btn);
        dropdown.appendChild(content);

        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) dropdown.classList.remove('active');
        });

        return dropdown;
    }

    createFilterChips() {
        const activeFields = Object.keys(this.state.activeFilters).filter(f => this.state.activeFilters[f].size > 0);
        if (activeFields.length === 0) return null;

        const container = document.createElement('div');
        container.className = 'mt-filter-chips';

        activeFields.forEach(field => {
            const filterDef = this.options.filters.find(f => f.field === field);
            this.state.activeFilters[field].forEach(val => {
                const chip = document.createElement('div');
                chip.className = 'mt-chip';
                chip.innerHTML = `
                    <span class="mt-chip-label">${filterDef.title}:</span>
                    <span class="mt-chip-value">${val}</span>
                    <span class="mt-chip-close">×</span>
                `;
                chip.querySelector('.mt-chip-close').addEventListener('click', () => this.handleFilterToggle(field, val));
                container.appendChild(chip);
            });
        });

        const clearAll = document.createElement('a');
        clearAll.className = 'mt-clear-filters';
        clearAll.textContent = 'Clear all';
        clearAll.addEventListener('click', () => this.handleClearAllFilters());
        container.appendChild(clearAll);

        return container;
    }

    createHeader() {
        const thead = document.createElement('thead');
        const tr = document.createElement('tr');

        this.options.columns.forEach(col => {
            if (this.state.hiddenColumns.has(col.field)) return;

            const th = document.createElement('th');

            const content = document.createElement('div');
            content.className = 'mt-th-content';
            content.innerHTML = `<span>${col.title}</span>`;

            if (col.sortable !== false) {
                th.classList.add('sortable');

                const icon = document.createElement('div');
                icon.className = 'mt-sort-icon';
                icon.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24"  xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"> 
                    <polyline points="8 8.333 12 4.333 16 8.333 16 8.333" class="up"></polyline> 
                    <polyline points="16 15.667 12 19.667 8 15.667 8 15.667" class="down"></polyline>
                </svg>
                `;
                content.appendChild(icon);

                if (this.state.sortKey === col.field) {
                    th.classList.add(this.state.sortOrder === 'asc' ? 'sort-asc' : 'sort-desc');
                }
                th.addEventListener('click', () => this.handleSort(col.field));
            }

            th.appendChild(content);
            tr.appendChild(th);
        });

        thead.appendChild(tr);
        return thead;
    }

    createBody() {
        const tbody = document.createElement('tbody');
        const data = this.getPagedData();

        if (data.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            const visibleCols = this.options.columns.filter(c => !this.state.hiddenColumns.has(c.field)).length;
            td.colSpan = visibleCols;
            td.className = 'mt-empty';
            td.textContent = 'No records found matching your filters';
            tr.appendChild(td);
            tbody.appendChild(tr);
            return tbody;
        }

        data.forEach(row => {
            const tr = document.createElement('tr');
            this.options.columns.forEach(col => {
                if (this.state.hiddenColumns.has(col.field)) return;

                const td = document.createElement('td');
                const val = row[col.field];

                if (col.render) {
                    td.innerHTML = col.render(val, row);
                } else {
                    td.textContent = val;
                }
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        return tbody;
    }

    createPaginationArea() {
        const div = document.createElement('div');
        div.className = 'mt-pagination';

        // Info & Per Page
        const left = document.createElement('div');
        left.className = 'mt-pagination-info';

        const info = document.createElement('span');
        const start = this.state.filteredData.length > 0 ? ((this.state.currentPage - 1) * this.state.pageSize) + 1 : 0;
        const end = Math.min(start + this.state.pageSize - 1, this.state.filteredData.length);
        info.textContent = `Showing ${start} to ${end} of ${this.state.filteredData.length} entries`;
        left.appendChild(info);

        // Per Page Select
        const select = document.createElement('select');
        select.className = 'mt-select';
        this.options.pageSizeOptions.forEach(opt => {
            const o = document.createElement('option');
            o.value = opt;
            o.textContent = `${opt} per page`;
            if (opt === this.state.pageSize) o.selected = true;
            select.appendChild(o);
        });
        select.addEventListener('change', (e) => this.handlePageSizeChange(parseInt(e.target.value)));
        left.appendChild(select);

        div.appendChild(left);

        // Buttons
        const totalPages = Math.ceil(this.state.filteredData.length / this.state.pageSize);
        const btns = document.createElement('div');
        btns.className = 'mt-pagination-btns';

        // Prev button
        const prev = document.createElement('button');
        prev.className = 'mt-btn mt-page-nav';
        prev.innerHTML = '&laquo;';
        prev.disabled = this.state.currentPage === 1;
        prev.addEventListener('click', () => this.setPage(this.state.currentPage - 1));
        btns.appendChild(prev);

        // Page Numbers
        const pages = this.getPaginationRange(this.state.currentPage, totalPages);
        pages.forEach(p => {
            if (p === '...') {
                const span = document.createElement('span');
                span.className = 'mt-pagination-ellipsis';
                span.textContent = '...';
                btns.appendChild(span);
            } else {
                const btn = document.createElement('button');
                btn.className = `mt-btn mt-page-btn ${this.state.currentPage === p ? 'active' : ''}`;
                btn.textContent = p;
                btn.addEventListener('click', () => this.setPage(p));
                btns.appendChild(btn);
            }
        });

        // Next button
        const next = document.createElement('button');
        next.className = 'mt-btn mt-page-nav';
        next.innerHTML = '&raquo;';
        next.disabled = this.state.currentPage === totalPages || totalPages === 0;
        next.addEventListener('click', () => this.setPage(this.state.currentPage + 1));
        btns.appendChild(next);

        div.appendChild(btns);
        return div;
    }

    getPaginationRange(current, total) {
        const delta = 2;
        const left = current - delta;
        const right = current + delta + 1;
        const range = [];
        const rangeWithDots = [];
        let l;

        for (let i = 1; i <= total; i++) {
            if (i === 1 || i === total || (i >= left && i < right)) {
                range.push(i);
            }
        }

        for (let i of range) {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        }

        return rangeWithDots;
    }

    // Logic Methods
    handleSearch(query) {
        this.state.searchQuery = query.toLowerCase();
        this.state.currentPage = 1;
        this.filterData();
        this.render();
    }

    handleFilterToggle(field, value) {
        if (this.state.activeFilters[field].has(value)) {
            this.state.activeFilters[field].delete(value);
        } else {
            this.state.activeFilters[field].add(value);
        }
        this.state.currentPage = 1;
        this.filterData();
        this.render();
        this.renderControls();
    }

    handleClearAllFilters() {
        Object.keys(this.state.activeFilters).forEach(f => this.state.activeFilters[f].clear());
        this.state.currentPage = 1;
        this.filterData();
        this.render();
        this.renderControls();
    }

    handleSort(key) {
        if (this.state.sortKey === key) {
            this.state.sortOrder = this.state.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.state.sortKey = key;
            this.state.sortOrder = 'asc';
        }
        this.filterData();
        this.render();
    }

    handlePageSizeChange(size) {
        this.state.pageSize = size;
        this.state.currentPage = 1;
        this.render();
    }

    toggleColumn(key) {
        if (this.state.hiddenColumns.has(key)) {
            this.state.hiddenColumns.delete(key);
        } else {
            this.state.hiddenColumns.add(key);
        }
        this.render();
    }

    setPage(page) {
        this.state.currentPage = page;
        this.render();
    }

    setData(newData) {
        this.options.data = [...newData];
        this.state.data = [...newData];
        this.state.currentPage = 1;
        this.filterData();
        this.render();
    }

    filterData() {
        let temp = [...this.options.data];

        // 1. Search (Global)
        if (this.state.searchQuery) {
            temp = temp.filter(row => {
                return this.options.columns.some(col => {
                    // Skip if explicitly marked as not searchable
                    if (col.searchable === false) return false;

                    const value = row[col.field];
                    if (value === null || value === undefined) return false;

                    return String(value)
                        .toLowerCase()
                        .includes(this.state.searchQuery);
                });
            });
        }

        // 2. Custom Filters (Intersection)
        Object.keys(this.state.activeFilters).forEach(field => {
            const activeValues = this.state.activeFilters[field];
            if (activeValues.size > 0) {
                temp = temp.filter(row => activeValues.has(row[field]));
            }
        });

        // 3. Sort
        if (this.state.sortKey) {
            temp.sort((a, b) => {
                const valA = a[this.state.sortKey];
                const valB = b[this.state.sortKey];

                if (typeof valA === 'string') {
                    return this.state.sortOrder === 'asc'
                        ? valA.localeCompare(valB)
                        : valB.localeCompare(valA);
                }

                if (valA < valB) return this.state.sortOrder === 'asc' ? -1 : 1;
                if (valA > valB) return this.state.sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
        }

        this.state.filteredData = temp;
    }

    getPagedData() {
        if (!this.options.pagination) return this.state.filteredData;
        const start = (this.state.currentPage - 1) * this.state.pageSize;
        return this.state.filteredData.slice(start, start + this.state.pageSize);
    }

    closeAllDropdowns(except) {
        document.querySelectorAll('.mt-dropdown').forEach(d => {
            if (d !== except) d.classList.remove('active');
        });
    }
}
