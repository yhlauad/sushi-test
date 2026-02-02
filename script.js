document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let state = {
        currentScreen: 'setup-screen',
        dinerCount: 2,
        diners: [], // { id: 'A', name: 'Member 1' }
        meals: [],  // { id, name, price, payers: ['A', 'B'] }
        serviceChargeRate: 0.1,
        editingMealId: null,
        // Calorie Tracker State
        sushiData: [],
        consumedSushi: [], // { sushi_name, calories, id }
        totalCalories: 0,
        calorieGoal: 1000,
        currentCategory: 'all',
        searchQuery: ''
    };

    // --- DOM Elements ---
    const screens = {
        setup: document.getElementById('setup-screen'),
        calc: document.getElementById('calc-screen'),
        result: document.getElementById('result-screen'),
        calorie: document.getElementById('calorie-screen')
    };

    const dinerCountEl = document.getElementById('diner-count');
    const historyList = document.getElementById('history-list');
    const grandTotalEl = document.getElementById('grand-total');
    const serviceChargeEl = document.getElementById('service-charge-amount');
    const dinerTotalsRow = document.getElementById('diner-totals-row');
    const itemCountBadge = document.getElementById('item-count-badge');
    const modalOverlay = document.getElementById('modal-overlay');

    // New DOM elements for Social Modal
    const socialModal = document.getElementById('social-follow-modal');
    const closeSocialBtn = document.getElementById('close-social-modal');

    // --- Social Modal Logic ---
    // Show modal after a small delay on page load
    setTimeout(() => {
        hideAllModals();
        socialModal.style.display = 'block';
        modalOverlay.style.display = 'flex';
    }, 500);

    closeSocialBtn.onclick = () => {
        socialModal.style.display = 'none';
        modalOverlay.style.display = 'none';
    };

    // --- Core Navigation ---
    function showScreen(screenId) {
        Object.values(screens).forEach(s => s.classList.remove('active'));
        screens[screenId.replace('-screen', '')].classList.add('active');
        state.currentScreen = screenId;
        window.scrollTo(0, 0);
    }

    // --- Setup Logic ---
    document.getElementById('plus-diner').onclick = () => {
        if (state.dinerCount < 10) {
            state.dinerCount++;
            updateSetupUI();
        }
    };

    document.getElementById('minus-diner').onclick = () => {
        if (state.dinerCount > 1) {
            state.dinerCount--;
            updateSetupUI();
        }
    };

    function updateSetupUI() {
        dinerCountEl.innerText = state.dinerCount;
    }

    document.getElementById('start-dining').onclick = () => {
        state.diners = Array.from({ length: state.dinerCount }, (_, i) => ({
            id: String.fromCharCode(65 + i),
            name: `成員 ${String.fromCharCode(65 + i)}`
        }));
        showScreen('calc-screen');
        renderHistory();
        updateTotals();
    };

    // --- Calculator Logic ---
    document.querySelectorAll('.plate-btn').forEach(btn => {
        btn.onclick = () => {
            const price = parseFloat(btn.dataset.price);
            const name = btn.dataset.name;
            addMeal(name, price);
        };
    });

    function addMeal(name, price) {
        const meal = {
            id: Date.now(),
            name: name,
            price: price,
            payers: state.diners.map(d => d.id) // Default split by all
        };
        state.meals.push(meal);
        renderHistory();
        updateTotals();
    }

    function renderHistory() {
        historyList.innerHTML = '';
        itemCountBadge.innerText = `共 ${state.meals.length} 項`;

        state.meals.slice().reverse().forEach(meal => {
            const item = document.createElement('div');
            item.className = 'history-item';

            const payerChips = state.diners.map(diner => `
                <div class="payer-chip ${meal.payers.includes(diner.id) ? 'active' : ''}" 
                     onclick="togglePayer(${meal.id}, '${diner.id}')">
                    ${diner.id}
                </div>
            `).join('');

            item.innerHTML = `
                <div class="item-main">
                    <span class="item-name">${meal.name}</span>
                    <span class="item-price">$${meal.price.toFixed(1)}</span>
                    <div class="payer-chips">${payerChips}</div>
                </div>
                <div class="item-actions">
                    <i class="fas fa-edit action-icon" onclick="editMealName(${meal.id})"></i>
                    <i class="fas fa-trash action-icon delete" onclick="deleteMeal(${meal.id})"></i>
                </div>
            `;
            historyList.appendChild(item);
        });
    }

    window.togglePayer = (mealId, dinerId) => {
        const meal = state.meals.find(m => m.id === mealId);
        if (meal.payers.includes(dinerId)) {
            if (meal.payers.length > 1) {
                meal.payers = meal.payers.filter(id => id !== dinerId);
            }
        } else {
            meal.payers.push(dinerId);
        }
        renderHistory();
        updateTotals();
    };

    window.deleteMeal = (id) => {
        state.meals = state.meals.filter(m => m.id !== id);
        renderHistory();
        updateTotals();
    };

    window.editMealName = (id) => {
        state.editingMealId = id;
        const meal = state.meals.find(m => m.id === id);
        document.getElementById('edit-name-input').value = meal.name;
        showModal('edit-name-modal');
    };

    function updateTotals() {
        let total = 0;
        const dinerTotals = {};
        state.diners.forEach(d => dinerTotals[d.id] = 0);

        state.meals.forEach(meal => {
            total += meal.price;
            const splitPrice = meal.price / meal.payers.length;
            meal.payers.forEach(pId => {
                dinerTotals[pId] += splitPrice;
            });
        });

        const grandTotal = total * (1 + state.serviceChargeRate);
        grandTotalEl.innerText = grandTotal.toFixed(2);
        serviceChargeEl.innerText = `+$${(total * state.serviceChargeRate).toFixed(2)}`;

        dinerTotalsRow.innerHTML = '';
        state.diners.forEach(diner => {
            const amount = dinerTotals[diner.id] * (1 + state.serviceChargeRate);
            const card = document.createElement('div');
            card.className = 'diner-total-card';
            card.innerHTML = `
                <span class="name">${diner.name}</span>
                <span class="amount">$${amount.toFixed(1)}</span>
            `;
            dinerTotalsRow.appendChild(card);
        });
    }

    // --- Modal Helpers ---
    function showModal(id) {
        hideAllModals();
        document.getElementById(id).style.display = 'block';
        modalOverlay.style.display = 'flex';
    }

    function hideAllModals() {
        document.getElementById('custom-plate-modal').style.display = 'none';
        document.getElementById('clear-confirm-modal').style.display = 'none';
        document.getElementById('edit-name-modal').style.display = 'none';
        document.getElementById('consumed-list-modal').style.display = 'none';
        document.getElementById('clear-calories-confirm-modal').style.display = 'none';
        document.getElementById('edit-goal-modal').style.display = 'none';
        document.getElementById('social-follow-modal').style.display = 'none';
        modalOverlay.style.display = 'none';
    }

    // Custom Plate Modal
    document.getElementById('custom-plate-btn').onclick = () => showModal('custom-plate-modal');
    document.getElementById('cancel-modal').onclick = hideAllModals;
    document.getElementById('confirm-custom').onclick = () => {
        const price = parseFloat(document.getElementById('custom-price').value);
        const name = document.getElementById('custom-name').value || '自定義項目';
        if (!isNaN(price) && price > 0) {
            addMeal(name, price);
            hideAllModals();
            document.getElementById('custom-price').value = '';
            document.getElementById('custom-name').value = '';
        }
    };

    // Clear History Modal
    document.getElementById('clear-history').onclick = () => showModal('clear-confirm-modal');
    document.getElementById('cancel-clear').onclick = hideAllModals;
    document.getElementById('confirm-clear').onclick = () => {
        state.meals = [];
        renderHistory();
        updateTotals();
        hideAllModals();
    };

    // Edit Name Modal
    document.getElementById('cancel-edit-name').onclick = hideAllModals;
    document.getElementById('confirm-edit-name').onclick = () => {
        const newName = document.getElementById('edit-name-input').value;
        if (newName && state.editingMealId) {
            const meal = state.meals.find(m => m.id === state.editingMealId);
            meal.name = newName;
            renderHistory();
            hideAllModals();
        }
    };

    // --- Webhook Submission Logic ---
    document.querySelector('.menu-btn').onclick = () => showScreen('result-screen');
    document.getElementById('return-calc').onclick = () => showScreen('calc-screen');
    document.querySelector('.back-to-calc').onclick = () => showScreen('calc-screen');
    document.getElementById('back-to-setup').onclick = () => showScreen('setup-screen');

    document.getElementById('submit-webhook').onclick = async () => {
        const amount = document.getElementById('receipt-amount').value;
        const code = document.getElementById('invite-code').value;
        const statusText = document.getElementById('status-text');
        const responseCodeEl = document.getElementById('response-code');
        const dot = document.querySelector('.dot');

        if (!amount) {
            alert('請輸入收據金額');
            return;
        }

        statusText.innerText = 'SUBMITTING...';
        dot.style.background = '#FFD700';

        try {
            const response = await fetch('https://discord.com/api/webhooks/1221773950106206268/7nB_rXmO6I_0i0iKx6o6fNInS6Y6I6N6_6y6u6H6I6N6_6y6u6H6I6N6_6y6u6H', { // Example URL
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: `📊 **新收據提交**\n金額: $${amount}\n邀請碼: ${code || '無'}\n人數: ${state.dinerCount}`
                })
            });

            // Simulated response for UI demo
            setTimeout(() => {
                const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase();
                responseCodeEl.innerText = randomCode;
                statusText.innerText = 'SUCCESSFULLY GENERATED';
                dot.style.background = '#34C759';
            }, 1500);

        } catch (err) {
            statusText.innerText = 'SUBMISSION ERROR';
            dot.style.background = '#FF3B30';
        }
    };

    // --- Calorie Tracker Logic ---
    async function initCalorieTracker() {
        try {
            const response = await fetch('sushiro-jp-calories.json');
            state.sushiData = await response.json();
            renderSushiGrid();
        } catch (err) {
            console.error('Failed to load sushi data', err);
        }
    }

    function renderSushiGrid() {
        const grid = document.getElementById('sushi-grid');
        grid.innerHTML = '';

        const filtered = state.sushiData.filter(item => {
            const matchCat = state.currentCategory === 'all' || item.cat === state.currentCategory;
            const matchSearch = item.sushi_name.toLowerCase().includes(state.searchQuery.toLowerCase());
            return matchCat && matchSearch;
        });

        filtered.forEach(item => {
            const card = document.createElement('div');
            card.className = 'sushi-card';
            card.innerHTML = `
                <img src="${item.image_url || 'https://via.placeholder.com/150?text=Sushi'}" class="sushi-img" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
                <span class="sushi-name">${item.sushi_name}</span>
                <span class="sushi-cal">${item.calories} kcal</span>
            `;
            card.onclick = () => addConsumedSushi(item);
            grid.appendChild(card);
        });
    }

    function addConsumedSushi(item) {
        const entry = { ...item, id: Date.now() };
        state.consumedSushi.push(entry);
        updateCalorieUI();
    }

    function updateCalorieUI() {
        const total = state.consumedSushi.reduce((sum, item) => sum + item.calories, 0);
        state.totalCalories = total;

        document.getElementById('total-calories').innerText = total;
        document.getElementById('goal-display').innerText = state.calorieGoal;
        document.getElementById('summary-goal-display').innerText = state.calorieGoal.toLocaleString();

        const remaining = state.calorieGoal - total;
        document.getElementById('remaining-calories').innerText = remaining.toLocaleString();
        document.getElementById('footer-remaining').innerText = remaining;
        document.getElementById('footer-count').innerText = state.consumedSushi.length;

        // Progress Ring
        const ring = document.getElementById('calorie-progress');
        const radius = ring.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        ring.style.strokeDasharray = `${circumference} ${circumference}`;

        const percent = Math.min(total / state.calorieGoal, 1);
        const offset = circumference - (percent * circumference);
        ring.style.strokeDashoffset = offset;

        // Color Change based on limit
        if (total > state.calorieGoal) {
            ring.style.stroke = "#FF3B30";
        } else {
            ring.style.stroke = "var(--primary-red)";
        }
    }

    document.getElementById('open-calorie-tracker').onclick = () => {
        showScreen('calorie-screen');
        if (state.sushiData.length === 0) initCalorieTracker();
    };

    document.getElementById('back-to-setup-from-cal').onclick = () => showScreen('setup-screen');

    // Consumed List Modal
    document.getElementById('show-consumed-list').onclick = () => {
        renderConsumedList();
        showModal('consumed-list-modal');
    };

    function renderConsumedList() {
        const list = document.getElementById('consumed-items-list');
        list.innerHTML = '';

        // Group by name for the list view
        const counts = {};
        state.consumedSushi.forEach(s => {
            counts[s.sushi_name] = (counts[s.sushi_name] || 0) + 1;
        });

        Object.keys(counts).forEach(name => {
            const firstEntry = state.consumedSushi.find(s => s.sushi_name === name);
            const row = document.createElement('div');
            row.className = 'consumed-row';
            row.innerHTML = `
                <img src="${firstEntry.image_url || 'https://via.placeholder.com/150'}" onerror="this.src='https://via.placeholder.com/150'">
                <div class="consumed-row-info">
                    <div class="consumed-row-name">${name}</div>
                    <div class="consumed-row-cal">${firstEntry.calories * counts[name]} kcal</div>
                </div>
                <div class="consumed-qty-control">
                    <button class="qty-btn" onclick="adjustSushiQty('${name}', -1)">-</button>
                    <span class="qty-val">${counts[name]}</span>
                    <button class="qty-btn" onclick="adjustSushiQty('${name}', 1)">+</button>
                </div>
            `;
            list.appendChild(row);
        });

        document.getElementById('modal-total-cal').innerText = `${state.totalCalories} kcal`;
    }

    window.adjustSushiQty = (name, delta) => {
        if (delta > 0) {
            const template = state.sushiData.find(s => s.sushi_name === name);
            addConsumedSushi(template);
        } else {
            const index = state.consumedSushi.map(s => s.sushi_name).lastIndexOf(name);
            if (index > -1) {
                state.consumedSushi.splice(index, 1);
                updateCalorieUI();
            }
        }
        renderConsumedList();
    };

    document.getElementById('close-consumed-modal').onclick = hideAllModals;
    document.getElementById('clear-all-consumed').onclick = () => showModal('clear-calories-confirm-modal');
    document.getElementById('cancel-clear-calories').onclick = () => showModal('consumed-list-modal');
    document.getElementById('confirm-clear-calories').onclick = () => {
        state.consumedSushi = [];
        updateCalorieUI();
        hideAllModals();
    };

    // Goal Editing
    const openEditGoalModal = () => {
        document.getElementById('new-goal-input').value = state.calorieGoal;
        showModal('edit-goal-modal');
    };

    const editGoalTrigger = document.getElementById('edit-goal-trigger');
    if (editGoalTrigger) editGoalTrigger.onclick = openEditGoalModal;

    const goalSummaryItem = document.getElementById('goal-summary-item');
    if (goalSummaryItem) goalSummaryItem.onclick = openEditGoalModal;

    document.getElementById('cancel-goal-edit').onclick = hideAllModals;

    document.getElementById('confirm-goal-edit').onclick = () => {
        const input = document.getElementById('new-goal-input');
        const newVal = parseInt(input.value);
        if (!isNaN(newVal) && newVal >= 500) {
            state.calorieGoal = newVal;
            updateCalorieUI();
            hideAllModals();
        } else {
            alert('請輸入合理的卡路里目標（至少 500 kcal）');
        }
    };

    // Search and Filters
    document.getElementById('sushi-search').oninput = (e) => {
        state.searchQuery = e.target.value;
        renderSushiGrid();
    };

    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.currentCategory = tab.dataset.category;
            renderSushiGrid();
        };
    });

    // Handle initial state if any
    updateSetupUI();
});