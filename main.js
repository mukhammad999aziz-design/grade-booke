// --- Константы ---
const STORAGE_KEY = 'gradebook_students_v1';
const GRADE_CHOICES = ['', '2', '3', '4', '5', 'Н/А']; // Н/А = нет оценки

// --- Элементы DOM ---
const tbody = document.getElementById('studentsBody');
const searchInput = document.getElementById('search');
const newSurname = document.getElementById('newSurname');
const newName = document.getElementById('newName');

// --- Загрузка данных ---
let students = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

// --- Сохранение ---
function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

// --- Рендер таблицы ---
function renderTable(query = '') {
    tbody.innerHTML = '';

    let filtered = students.filter(s => {
        const full = (s.surname + ' ' + s.name).toLowerCase();
        return full.includes(query.toLowerCase());
    });

    filtered.forEach(s => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${escapeHtml(s.surname)}</td>
            <td>${escapeHtml(s.name)}</td>
        `;

        // Столбцы оценок
        for (let i = 0; i < (s.grades.length || 2); i++) {
            const val = s.grades[i] || '';
            const td = document.createElement('td');
            const select = document.createElement('select');

            select.className = 'grade';
            select.dataset.sid = s.id;
            select.dataset.idx = i;

            GRADE_CHOICES.forEach(g => {
                const opt = document.createElement('option');
                opt.value = g;
                opt.textContent = g || '—';
                if (g === val) opt.selected = true;
                select.appendChild(opt);
            });

            select.addEventListener('change', () => {
                const sid = select.dataset.sid;
                const idx = Number(select.dataset.idx);
                setGrade(sid, idx, select.value);
            });

            td.appendChild(select);
            tr.appendChild(td);
        }

        // Кнопка удаления
        const actions = document.createElement('td');
        actions.className = 'actions';

        const del = document.createElement('button');
        del.className = 'tiny';
        del.textContent = 'Удалить';

        del.addEventListener('click', () => {
            if (confirm('Удалить ученика окончательно?')) {
                removeStudent(s.id);
            }
        });

        actions.appendChild(del);
        tr.appendChild(actions);

        tbody.appendChild(tr);
    });
}

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// --- Управление учениками ---
function addStudent(surname, name) {
    if (!surname.trim() && !name.trim()) {
        return alert('Введите фамилию или имя!');
    }

    const id = Date.now().toString();
    const gradesCount = students[0]?.grades?.length || 2;

    const newS = {
        id,
        surname: surname.trim(),
        name: name.trim(),
        grades: Array.from({ length: gradesCount }, () => '')
    };

    students.push(newS);
    save();
    renderTable(searchInput.value);

    newSurname.value = '';
    newName.value = '';
}

function removeStudent(id) {
    students = students.filter(s => s.id !== id);
    save();
    renderTable(searchInput.value);
}

function setGrade(sid, idx, value) {
    students = students.map(s =>
        s.id === sid
            ? { ...s, grades: s.grades.map((g, i) => (i === idx ? value : g)) }
            : s
    );
    save();
}

function addGradeColumn() {
    students = students.map(s => ({
        ...s,
        grades: [...s.grades, '']
    }));
    save();
    renderTable(searchInput.value);
}

function removeGradeColumn() {
    students = students.map(s => ({
        ...s,
        grades: s.grades.slice(0, -1)
    }));
    save();
    renderTable(searchInput.value);
}

function clearAll() {
    if (!confirm('Очистить всех учеников и оценки?')) return;
    students = [];
    localStorage.removeItem(STORAGE_KEY);
    renderTable();
}

// --- Экспорт JSON ---
function exportJSON() {
    const blob = new Blob(
        [JSON.stringify(students, null, 2)],
        { type: 'application/json' }
    );
    downloadBlob(blob, 'gradebook_export.json');
}

// --- Экспорт CSV ---
function exportCSV() {
    if (!students.length) return alert('Нет данных');

    const cols = students[0].grades.length;
    const header = [
        'Фамилия',
        'Имя',
        ...Array.from({ length: cols }, (_, i) => `Оценка ${i + 1}`)
    ];

    const rows = students.map(s => [
        s.surname,
        s.name,
        ...s.grades
    ]);

    const csv = [
        header,
        ...rows
    ]
        .map(r => r.map(cell => `"${String(cell || '')}"`).join(','))
        .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    downloadBlob(blob, 'gradebook_export.csv');
}

// --- Скачивание файла ---
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

// --- Обработчики ---
// Поиск
searchInput.addEventListener('input', () =>
    renderTable(searchInput.value)
);

// Первый рендер
renderTable();
