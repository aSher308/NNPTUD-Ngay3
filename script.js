// Cấu hình
const API_URL = "https://api.escuelajs.co/api/v1/products";
let allProducts = []; // Chứa toàn bộ dữ liệu gốc
let filteredProducts = []; // Chứa dữ liệu sau khi search/sort
let currentPage = 1;
let itemsPerPage = 10;
let sortColumn = null;
let sortAsc = true;
let modalInstance = null; // Để quản lý Bootstrap Modal

// Khởi chạy khi load trang
document.addEventListener('DOMContentLoaded', () => {
    modalInstance = new bootstrap.Modal(document.getElementById('productModal'));
    fetchProducts();

    // Event Listeners
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('pageSizeSelect').addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        renderTable();
        renderPagination();
    });
});

// 1. Fetch Data
async function fetchProducts() {
    showLoading(true);
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        // Kiểm tra dữ liệu trả về có phải mảng không
        if (Array.isArray(data)) {
            allProducts = data;
            filteredProducts = [...allProducts]; // Copy data
            renderTable();
            renderPagination();
        } else {
            alert("Lỗi cấu trúc dữ liệu từ API");
        }
    } catch (error) {
        console.error("Error fetching data:", error);
        alert("Không thể tải dữ liệu.");
    } finally {
        showLoading(false);
    }
}

// 2. Render Table
function renderTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    // Tính toán phân trang
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredProducts.slice(start, end);

    pageData.forEach(item => {
        // Xử lý ảnh (API trả về mảng ảnh, lấy cái đầu tiên)
        // Một số ảnh API bị lỗi cú pháp mảng dạng string "[\"url\"]", cần clean
        let imgUrl = "https://via.placeholder.com/50";
        if (item.images && item.images.length > 0) {
             // Clean string brackets if simple string parsing fails (API quirk handling)
             let rawImg = item.images[0];
             imgUrl = rawImg.replace(/[\[\]"]/g, ''); 
             if (!imgUrl.startsWith('http')) imgUrl = rawImg; // Fallback
        }

        const tr = document.createElement('tr');
        
        // YÊU CẦU: Description hiển thị khi di chuột (sử dụng title attribute hoặc Bootstrap Tooltip)
        // Ở đây dùng title attribute cho đơn giản và đúng yêu cầu "di chuột đến dòng".
        // Để đẹp hơn, ta gán attribute data-bs-toggle="tooltip" của Bootstrap.
        tr.setAttribute('title', `Mô tả: ${item.description}`);
        tr.setAttribute('data-bs-toggle', 'tooltip');
        tr.setAttribute('data-bs-placement', 'top');

        tr.innerHTML = `
            <td>${item.id}</td>
            <td><img src="${imgUrl}" class="product-img" alt="img" onerror="this.src='https://via.placeholder.com/50'"></td>
            <td><strong>${item.title}</strong></td>
            <td>$${item.price}</td>
            <td><span class="badge bg-info text-dark">${item.category ? item.category.name : 'Unknown'}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditModal(${item.id})">
                    <i class="bi bi-eye"></i> View/Edit
                </button>
            </td>
        `;
        
        // Click vào item để xem detail (như yêu cầu)
        // Lưu ý: Nút View/Edit đã xử lý việc này, nhưng nếu muốn click cả dòng:
        // tr.onclick = () => openEditModal(item.id); 

        tbody.appendChild(tr);
    });

    // Kích hoạt lại Tooltips của Bootstrap sau khi render mới
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// 3. Render Pagination
function renderPagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    // Prev Button
    pagination.innerHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Prev</a>
        </li>
    `;

    // Page Numbers (Hiển thị đơn giản 1 vài trang để tránh quá dài)
    // Logic đơn giản: Hiển thị trang hiện tại
    for (let i = 1; i <= totalPages; i++) {
        // Chỉ hiển thị trang đầu, trang cuối, và xung quanh trang hiện tại
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            pagination.innerHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                </li>
            `;
        }
    }

    // Next Button
    pagination.innerHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>
        </li>
    `;
}

function changePage(page) {
    if (page < 1 || page > Math.ceil(filteredProducts.length / itemsPerPage)) return;
    currentPage = page;
    renderTable();
    renderPagination();
}

// 4. Search
function handleSearch(e) {
    const keyword = e.target.value.toLowerCase();
    filteredProducts = allProducts.filter(p => p.title.toLowerCase().includes(keyword));
    currentPage = 1; // Reset về trang 1 khi search
    handleSort(sortColumn, false); // Re-apply sort nếu đang sort
    renderTable();
    renderPagination();
}

// 5. Sort
function handleSort(column, toggle = true) {
    if (!column) return;
    
    // Nếu click lại cột cũ thì đảo chiều, nếu không thì mặc định tăng dần
    if (toggle) {
        if (sortColumn === column) {
            sortAsc = !sortAsc;
        } else {
            sortColumn = column;
            sortAsc = true;
        }
    }

    // Update Icon UI
    document.querySelectorAll('.bi-arrow-down-up').forEach(i => i.className = 'bi bi-arrow-down-up text-muted'); // Reset
    const activeIcon = document.getElementById(`sort-icon-${column}`);
    if(activeIcon) activeIcon.className = sortAsc ? 'bi bi-sort-down' : 'bi bi-sort-up';

    filteredProducts.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        // Nếu là string thì dùng localeCompare
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
    });

    renderTable();
}

// 6. Export CSV
function exportToCSV() {
    // Header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Title,Price,Category,Description\n";

    // Data (Export dữ liệu đang filter hiện tại)
    filteredProducts.forEach(row => {
        // Xử lý dấu phẩy trong nội dung để không vỡ CSV
        const title = `"${row.title.replace(/"/g, '""')}"`;
        const desc = `"${row.description.replace(/"/g, '""')}"`;
        const cat = row.category ? row.category.name : "";
        csvContent += `${row.id},${title},${row.price},${cat},${desc}\n`;
    });

    // Tạo link download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "products_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 7. Modals & CRUD
// Reset form helper
function resetForm() {
    document.getElementById('productForm').reset();
    document.getElementById('imagePreview').src = '';
    document.getElementById('imagePreview').style.display = 'none';
}

// OPEN Create
function openCreateModal() {
    resetForm();
    document.getElementById('modalTitle').innerText = "Tạo Sản Phẩm Mới";
    document.getElementById('productId').value = ""; // Empty ID = Create
    document.getElementById('saveBtn').innerText = "Tạo mới";
    modalInstance.show();
}

// OPEN Edit (View Detail luôn)
function openEditModal(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    resetForm();
    document.getElementById('modalTitle').innerText = `Chỉnh sửa: ${product.title}`;
    document.getElementById('productId').value = product.id;
    document.getElementById('productTitle').value = product.title;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productCategoryId').value = product.category ? product.category.id : 1;
    
    // Xử lý ảnh để hiển thị trong input
    let imgUrl = "";
    if (product.images && product.images.length > 0) {
        imgUrl = product.images[0].replace(/[\[\]"]/g, '');
    }
    document.getElementById('productImage').value = imgUrl;
    document.getElementById('imagePreview').src = imgUrl;
    document.getElementById('imagePreview').style.display = 'block';

    document.getElementById('saveBtn').innerText = "Cập nhật";
    modalInstance.show();
}

// SAVE Function (POST or PUT)
async function saveProduct() {
    const id = document.getElementById('productId').value;
    const title = document.getElementById('productTitle').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const description = document.getElementById('productDescription').value;
    const categoryId = parseInt(document.getElementById('productCategoryId').value);
    const imageUrl = document.getElementById('productImage').value;

    if (!title || !price || !description || !imageUrl) {
        alert("Vui lòng điền đầy đủ thông tin!");
        return;
    }

    const payload = {
        title,
        price,
        description,
        categoryId,
        images: [imageUrl]
    };

    showLoading(true);
    try {
        let response;
        if (id) {
            // UPDATE (PUT)
            response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            // CREATE (POST)
            response = await fetch(API_URL + "/", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        if (response.ok) {
            const result = await response.json();
            alert(id ? "Cập nhật thành công!" : "Tạo mới thành công!");
            modalInstance.hide();
            // Reload data
            fetchProducts(); 
        } else {
            alert("Có lỗi xảy ra khi lưu dữ liệu.");
        }
    } catch (error) {
        console.error(error);
        alert("Lỗi kết nối server.");
    } finally {
        showLoading(false);
    }
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}