// تهيئة جداول البيانات
$(document).ready(function() {
    // تعريف الترجمة العربية
    const arabicTranslation = {
        "sProcessing": "جارٍ التحميل...",
        "sLengthMenu": "أظهر _MENU_ مدخلات",
        "sZeroRecords": "لم يعثر على أية سجلات",
        "sInfo": "إظهار _START_ إلى _END_ من أصل _TOTAL_ مدخل",
        "sInfoEmpty": "يعرض 0 إلى 0 من أصل 0 سجل",
        "sInfoFiltered": "(منتقاة من مجموع _MAX_ مُدخل)",
        "sInfoPostFix": "",
        "sSearch": "ابحث:",
        "sUrl": "",
        "oPaginate": {
            "sFirst": "الأول",
            "sPrevious": "السابق",
            "sNext": "التالي",
            "sLast": "الأخير"
        }
    };

    // جدول المحادثات
    window.conversationsTable = $('#conversations-table').DataTable({
        language: arabicTranslation,
        order: [[3, 'desc']],
        pageLength: 10,
        responsive: true
    });

    // جدول قاعدة المعرفة
    window.knowledgeTable = $('#knowledge-table').DataTable({
        language: arabicTranslation,
        order: [[0, 'desc']],
        pageLength: 10,
        responsive: true
    });

    // جدول سجل النشاطات
    window.activitiesTable = $('#activities-table').DataTable({
        language: arabicTranslation,
        order: [[5, 'desc']],
        pageLength: 10,
        responsive: true
    });

    // أزرار التصدير والحذف
    $('#exportKnowledge').click(exportKnowledgeToFile);
    $('#truncateKnowledge').click(truncateKnowledge);
    $('#exportConversations').click(exportConversationsToFile);
    $('#truncateConversations').click(truncateConversations);
    $('#exportTopics').click(exportTopicsToFile);

    // تحميل البيانات
    loadAnalytics();
    loadConversations();
    loadKnowledge();
    loadActivities();
    loadTopicDetails();

    // حدث إضافة معرفة جديدة
    $('#saveKnowledge').click(function() {
        const data = {
            category: $('#category').val(),
            question: $('#question').val(),
            answer: $('#answer').val()
        };

        fetch('https://bitter-safe-diplodocus.glitch.me/api/knowledge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert('حدث خطأ: ' + data.error);
            } else {
                $('#addKnowledgeModal').modal('hide');
                $('#knowledgeForm')[0].reset();
                loadKnowledge();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('حدث خطأ في الاتصال');
        });
    });

    // حدث تحديث المعرفة
    $('#updateKnowledge').click(function() {
        const id = $('#editId').val();
        const data = {
            category: $('#editCategory').val(),
            question: $('#editQuestion').val(),
            answer: $('#editAnswer').val()
        };

        fetch(`https://bitter-safe-diplodocus.glitch.me/api/knowledge/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert('حدث خطأ: ' + data.error);
            } else {
                $('#editKnowledgeModal').modal('hide');
                loadKnowledge();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('حدث خطأ في الاتصال');
        });
    });

    // تحديث البيانات كل 30 ثانية
    setInterval(() => {
        loadAnalytics();
        loadConversations();
        loadKnowledge();
        loadActivities();
        loadTopicDetails();
    }, 30000);
});

// المتغيرات العامة
const API_URL = 'https://bitter-safe-diplodocus.glitch.me/api';
const knowledgeForm = document.getElementById('knowledge-form');
const knowledgeList = document.getElementById('knowledge-list');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');

// تحميل قائمة المعرفة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', loadKnowledgeList);

// إضافة معرفة جديدة
knowledgeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = {
        category: document.getElementById('category').value,
        question: document.getElementById('question').value,
        answer: document.getElementById('answer').value
    };

    try {
        const response = await fetch(`${API_URL}/knowledge`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (data.error) {
            alert('حدث خطأ: ' + data.error);
        } else {
            alert('تمت إضافة المعرفة بنجاح');
            knowledgeForm.reset();
            loadKnowledgeList();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('حدث خطأ أثناء إضافة المعرفة');
    }
});

// تحميل قائمة المعرفة
async function loadKnowledgeList() {
    try {
        const response = await fetch(`${API_URL}/knowledge`);
        const items = await response.json();
        
        knowledgeList.innerHTML = items.map(item => `
            <tr>
                <td>${item.category}</td>
                <td>${item.question}</td>
                <td>${item.answer}</td>
                <td>
                    <span class="status-${item.active ? 'active' : 'inactive'}">
                        ${item.active ? 'نشط' : 'غير نشط'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button onclick="editKnowledge(${item.id})" class="edit-btn">
                            <i class="fas fa-edit"></i> تعديل
                        </button>
                        <button onclick="toggleKnowledge(${item.id})" class="toggle-btn">
                            <i class="fas fa-power-off"></i> ${item.active ? 'تعطيل' : 'تفعيل'}
                        </button>
                        <button onclick="deleteKnowledge(${item.id})" class="delete-btn">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error:', error);
        alert('حدث خطأ أثناء تحميل قائمة المعرفة');
    }
}

// تحرير معرفة
async function editKnowledge(id) {
    try {
        const response = await fetch(`${API_URL}/knowledge/${id}`);
        const item = await response.json();
        
        document.getElementById('edit-id').value = item.id;
        document.getElementById('edit-category').value = item.category;
        document.getElementById('edit-question').value = item.question;
        document.getElementById('edit-answer').value = item.answer;
        
        editModal.style.display = 'block';
    } catch (error) {
        console.error('Error:', error);
        alert('حدث خطأ أثناء تحميل بيانات المعرفة');
    }
}

// حفظ التغييرات
editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const formData = {
        category: document.getElementById('edit-category').value,
        question: document.getElementById('edit-question').value,
        answer: document.getElementById('edit-answer').value
    };

    try {
        const response = await fetch(`${API_URL}/knowledge/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (data.error) {
            alert('حدث خطأ: ' + data.error);
        } else {
            alert('تم تحديث المعرفة بنجاح');
            closeModal();
            loadKnowledgeList();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('حدث خطأ أثناء تحديث المعرفة');
    }
});

// تبديل حالة المعرفة (نشط/غير نشط)
async function toggleKnowledge(id) {
    if (!confirm('هل أنت متأكد من تغيير حالة هذه المعرفة؟')) return;

    try {
        const response = await fetch(`${API_URL}/knowledge/${id}/toggle`, {
            method: 'POST'
        });

        const data = await response.json();
        if (data.error) {
            alert('حدث خطأ: ' + data.error);
        } else {
            loadKnowledgeList();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('حدث خطأ أثناء تغيير حالة المعرفة');
    }
}

// حذف معرفة
async function deleteKnowledge(id) {
    if (!confirm('هل أنت متأكد من حذف هذه المعرفة؟')) return;

    try {
        const response = await fetch(`${API_URL}/knowledge/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        if (data.error) {
            alert('حدث خطأ: ' + data.error);
        } else {
            loadKnowledgeList();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('حدث خطأ أثناء حذف المعرفة');
    }
}

// إغلاق النافذة المنبثقة
function closeModal() {
    editModal.style.display = 'none';
    editForm.reset();
}

// إغلاق النافذة المنبثقة عند النقر خارجها
window.onclick = function(event) {
    if (event.target === editModal) {
        closeModal();
    }
};

// تحميل قاعدة المعرفة
function loadKnowledge() {
    fetch(`${API_URL}/knowledge`)
        .then(response => response.json())
        .then(data => {
            const table = window.knowledgeTable;
            table.clear();

            data.forEach(item => {
                const toggleButton = `
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" 
                            ${item.active ? 'checked' : ''} 
                            onchange="toggleKnowledgeActive(${item.id}, this.checked)">
                    </div>`;

                const actions = `
                    <button class="btn btn-sm btn-primary me-1" onclick="editKnowledge(${item.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteKnowledge(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>`;

                table.row.add([
                    item.id,
                    item.category,
                    item.question,
                    item.answer,
                    toggleButton,
                    new Date(item.created_at).toLocaleString('ar-SA'),
                    actions
                ]);
            });

            table.draw();
        })
        .catch(error => console.error('Error:', error));
}

// تفعيل/تعطيل المعرفة
function toggleKnowledgeActive(id, active) {
    fetch(`${API_URL}/knowledge/${id}/toggle`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active: active })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('حدث خطأ: ' + data.error);
            loadKnowledge();  // إعادة تحميل الجدول
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('حدث خطأ في الاتصال');
        loadKnowledge();  // إعادة تحميل الجدول
    });
}

// تحرير المعرفة
function editKnowledge(id) {
    fetch(`${API_URL}/knowledge/${id}`)
        .then(response => response.json())
        .then(data => {
            $('#category').val(data.category);
            $('#question').val(data.question);
            $('#answer').val(data.answer);
            
            // تحويل زر الحفظ إلى تحديث
            const saveButton = $('#saveKnowledge');
            saveButton.text('تحديث');
            saveButton.off('click').click(() => updateKnowledge(id));
            
            $('#addKnowledgeModal').modal('show');
        })
        .catch(error => {
            console.error('Error:', error);
            alert('حدث خطأ في جلب البيانات');
        });
}

// تحديث المعرفة
function updateKnowledge(id) {
    const data = {
        category: $('#category').val(),
        question: $('#question').val(),
        answer: $('#answer').val()
    };

    fetch(`${API_URL}/knowledge/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('حدث خطأ: ' + data.error);
        } else {
            $('#addKnowledgeModal').modal('hide');
            $('#knowledgeForm')[0].reset();
            
            // إعادة زر الحفظ إلى حالته الأصلية
            const saveButton = $('#saveKnowledge');
            saveButton.text('حفظ');
            saveButton.off('click').click(() => $('#saveKnowledge').click());
            
            loadKnowledge();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('حدث خطأ في الاتصال');
    });
}

// حذف المعرفة
function deleteKnowledge(id) {
    if (confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
        fetch(`${API_URL}/knowledge/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert('حدث خطأ: ' + data.error);
            } else {
                loadKnowledge();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('حدث خطأ في الاتصال');
        });
    }
}

// تصدير قاعدة المعرفة
async function exportKnowledge() {
    try {
        window.location.href = `${API_URL}/knowledge/export`;
    } catch (error) {
        console.error('Error:', error);
        alert('حدث خطأ أثناء تصدير قاعدة المعرفة');
    }
}

// حذف قاعدة المعرفة
async function clearKnowledge() {
    if (!confirm('هل أنت متأكد من حذف جميع البيانات من قاعدة المعرفة؟')) return;
    
    try {
        const response = await fetch(`${API_URL}/knowledge/truncate`, {
            method: 'POST'
        });

        const data = await response.json();
        if (data.error) {
            alert('حدث خطأ: ' + data.error);
        } else {
            alert('تم حذف جميع البيانات بنجاح');
            loadKnowledgeList();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('حدث خطأ أثناء حذف البيانات');
    }
}

// تصدير المحادثات
async function exportConversations() {
    try {
        window.location.href = `${API_URL}/conversations/export`;
    } catch (error) {
        console.error('Error:', error);
        alert('حدث خطأ أثناء تصدير المحادثات');
    }
}

// حذف المحادثات
async function clearConversations() {
    if (!confirm('هل أنت متأكد من حذف جميع المحادثات؟')) return;
    
    try {
        const response = await fetch(`${API_URL}/conversations/clear`, {
            method: 'POST'
        });

        const data = await response.json();
        if (data.error) {
            alert('حدث خطأ: ' + data.error);
        } else {
            alert('تم حذف جميع المحادثات بنجاح');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('حدث خطأ أثناء حذف المحادثات');
    }
}

// تصدير تحليل المواضيع
function exportTopicsToFile() {
    fetch(`${API_URL}/analytics/export`)
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'topics_analysis.txt';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('حدث خطأ في تصدير تحليل المواضيع');
        });
}

// تحميل تفاصيل المواضيع
function loadTopicDetails() {
    fetch(`${API_URL}/analytics/topics`)
        .then(response => response.json())
        .then(data => {
            const topicsHtml = data.popular_topics
                .map(topic => `
                    <div class="topic-item mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <h6 class="mb-0">${topic.topic}</h6>
                            <span class="badge bg-primary">${topic.count} سؤال</span>
                        </div>
                        <div class="topic-questions mt-2">
                            ${topic.questions.map(q => `
                                <div class="question-item">
                                    <small class="text-muted">س: ${q.question}</small>
                                    <br>
                                    <small class="text-success">ج: ${q.answer}</small>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `)
                .join('');
            
            $('#topic-details').html(topicsHtml);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('حدث خطأ في تحميل تفاصيل المواضيع');
        });
}

// تحميل الإحصائيات
function loadAnalytics() {
    // جلب الإحصائيات
    fetch(`${API_URL}/analytics`)
        .then(response => response.json())
        .then(data => {
            $('#total-conversations').text(data.total_conversations);
            $('#today-conversations').text(data.daily_conversations);
            
            // تحديث المواضيع الشائعة
            const topicsHtml = data.popular_topics
                .map(topic => `
                    <div class="d-flex justify-content-between mb-2">
                        <span>${topic.topic}</span>
                        <span class="badge bg-primary">${topic.count}</span>
                    </div>
                `)
                .join('');
            $('#popular-topics').html(topicsHtml);
        })
        .catch(error => console.error('Error fetching analytics:', error));
}

// تحميل المحادثات
function loadConversations() {
    fetch(`${API_URL}/conversations`)
        .then(response => response.json())
        .then(data => {
            const table = window.conversationsTable;
            table.clear();

            data.forEach(conv => {
                table.row.add([
                    conv.id,
                    conv.user_message,
                    conv.bot_response,
                    new Date(conv.timestamp).toLocaleString('ar-SA'),
                    conv.user_ip
                ]);
            });

            table.draw();
        })
        .catch(error => console.error('Error fetching conversations:', error));
}

// تحميل سجل النشاطات
function loadActivities() {
    fetch(`${API_URL}/activities`)
        .then(response => response.json())
        .then(data => {
            const table = window.activitiesTable;
            table.clear();

            data.forEach(activity => {
                let actionClass = '';
                switch(activity.action) {
                    case 'إضافة':
                        actionClass = 'text-success';
                        break;
                    case 'تعديل':
                        actionClass = 'text-primary';
                        break;
                    case 'حذف':
                        actionClass = 'text-danger';
                        break;
                    case 'تفعيل':
                        actionClass = 'text-success';
                        break;
                    case 'تعطيل':
                        actionClass = 'text-warning';
                        break;
                }

                table.row.add([
                    activity.id,
                    `<span class="${actionClass}">${activity.action}</span>`,
                    activity.entity_type,
                    activity.description,
                    activity.user_ip,
                    new Date(activity.timestamp).toLocaleString('ar-SA')
                ]);
            });

            table.draw();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('حدث خطأ في تحميل سجل النشاطات');
        });
}
