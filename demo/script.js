let table = new ModernTable('#user-table', {
    pageSize: 5,
    pageSizeOptions: [5, 10, 15, 20],
    searchPlaceholder: 'Search by name, email, role ...',
    showSearch: true,
    showColumns: true,
    pagination: true,
    filters: [
        {
            field: 'role',
            title: 'Role',
            options: ['Designer', 'Developer', 'Manager', 'Security', 'Marketing']
        },
        {
            field: 'status',
            title: 'Status',
            options: ['Active', 'Inactive', 'Pending']
        }
    ],
    columns: [
        {
            field: 'name',
            title: 'Employee Name',
            render: (val, row) => `
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 32px; height: 32px; border-radius: 50%; background: #e5e7eb; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #4b5563;">
                                ${val.charAt(0)}
                            </div>
                            <span style="font-weight: 500; color: #111827;">${val}</span>
                        </div>
                    `
        },
        { field: 'email', title: 'Email' },
        {
            field: 'role',
            title: 'Role',
            render: (val) => `<span class="mt-badge mt-badge-neutral">${val}</span>`
        },
        { field: 'country', title: 'Location' },
        {
            field: 'status',
            title: 'Status',
            searchable: false,
            render: (val) => {
                let cls = 'mt-badge-neutral';
                if (val === 'Active') cls = 'mt-badge-success';
                if (val === 'Inactive') cls = 'mt-badge-danger';
                if (val === 'Pending') cls = 'mt-badge-warning';
                return `<span class="mt-badge ${cls}">${val}</span>`;
            }
        },
        {
            field: 'id',
            title: 'Actions',
            sortable: false,
            render: () => `
                        <button class="mt-btn" style="padding: 4px 8px;">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                        </button>
                    `
        }
    ]
});