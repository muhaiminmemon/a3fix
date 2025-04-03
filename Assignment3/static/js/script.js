function submitRemarkRequest(assignmentId) {
    const reason = document.getElementById(`remark-reason-${assignmentId}`).value;
    if (!reason.trim()) {
        alert('Please provide a reason for your remark request');
        return;
    }

    fetch('/submit-remark', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            assignment_id: assignmentId,
            reason: reason
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const remarkSection = document.getElementById(`remark-section-${assignmentId}`);
            remarkSection.innerHTML = `
                <div class="alert alert-success">
                    Remark request submitted successfully!
                    <br>
                    Status: <span class="badge badge-pending">Pending</span>
                </div>
            `;
        } else {
            alert('Failed to submit remark request: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while submitting the remark request');
    });
}

function submitFeedback() {
    const formData = {
        instructor_id: document.getElementById('instructor-select').value,
        teaching_feedback: document.getElementById('teaching-feedback').value,
        teaching_improvement: document.getElementById('teaching-improvement').value,
        lab_feedback: document.getElementById('lab-feedback').value,
        lab_improvement: document.getElementById('lab-improvement').value
    };

    if (!formData.instructor_id || !formData.teaching_feedback || !formData.teaching_improvement || 
        !formData.lab_feedback || !formData.lab_improvement) {
        alert('Please fill out all fields in the feedback form');
        return;
    }

    fetch('/submit-feedback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('feedbackForm').reset();
            const feedbackContainer = document.getElementById('feedback-container');
            if (feedbackContainer) {
                feedbackContainer.innerHTML = `
                    <div class="alert alert-success">
                        Your feedback has been submitted successfully!
                    </div>
                `;
            } else {
                alert('Feedback submitted successfully!');
                window.location.reload();
            }
        } else {
            alert('Failed to submit feedback: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while submitting the feedback');
    });
}

function updateMark(studentId, assignmentId) {
    const mark = document.getElementById(`mark-${studentId}-${assignmentId}`).value;
    
    fetch('/update-mark', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            student_id: studentId,
            assignment_id: assignmentId,
            mark: mark
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const markCell = document.getElementById(`mark-cell-${studentId}-${assignmentId}`);
            markCell.innerHTML = `
                <span class="mark-value">${mark}</span>
                <span class="badge badge-success">Updated</span>
            `;
            
            const messageDiv = document.getElementById('update-message');
            messageDiv.innerHTML = '<div class="alert alert-success">Marks updated successfully!</div>';
            setTimeout(() => {
                messageDiv.innerHTML = '';
            }, 3000);
        } else {
            alert('Failed to update mark: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while updating the mark');
    });
}

function updateRemarkStatus(requestId, newStatus) {
    fetch('/update-remark-status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            request_id: requestId,
            status: newStatus
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const remarkCard = document.querySelector(`.remark-card[data-request-id="${requestId}"]`);
            if (remarkCard) {
                remarkCard.classList.remove('pending', 'approved', 'rejected');
                remarkCard.classList.add(newStatus.toLowerCase());
                
                const statusBadge = remarkCard.querySelector('.status-badge');
                if (statusBadge) {
                    statusBadge.className = `status-badge ${newStatus.toLowerCase()}`;
                    statusBadge.textContent = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
                }
                
                const remarkActions = remarkCard.querySelector('.remark-actions');
                if (remarkActions) {
                    const badgeHtml = `<div class="status-badge ${newStatus}">${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</div>`;
                    
                    let actionsHtml = badgeHtml;
                    
                    if (newStatus !== 'approved') {
                        actionsHtml += `
                            <form method="POST" action="/instructor/update-remark/${requestId}">
                                <input type="hidden" name="status" value="approved">
                                <button type="submit" class="button approve-button">
                                    Approve Request
                                </button>
                            </form>
                        `;
                    }
                    
                    if (newStatus !== 'rejected') {
                        actionsHtml += `
                            <form method="POST" action="/instructor/update-remark/${requestId}">
                                <input type="hidden" name="status" value="rejected">
                                <button type="submit" class="button reject-button">
                                    Reject Request
                                </button>
                            </form>
                        `;
                    }
                    
                    if (newStatus !== 'pending') {
                        actionsHtml += `
                            <form method="POST" action="/instructor/update-remark/${requestId}">
                                <input type="hidden" name="status" value="pending">
                                <button type="submit" class="button secondary-button">
                                    Reset to Pending
                                </button>
                            </form>
                        `;
                    }
                    
                    remarkActions.innerHTML = actionsHtml;
                }
            }
        } else {
            alert('Failed to update remark status: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while updating the remark status');
    });
}

function markFeedbackReviewed(feedbackId) {
    fetch('/mark-feedback-reviewed', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            feedback_id: feedbackId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const feedbackRow = document.getElementById(`feedback-${feedbackId}`);
            feedbackRow.classList.add('reviewed');
            
            const reviewButton = document.getElementById(`review-button-${feedbackId}`);
            reviewButton.innerHTML = '<span class="badge badge-success">Reviewed</span>';
            reviewButton.disabled = true;
        } else {
            alert('Failed to mark feedback as reviewed: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while marking the feedback as reviewed');
    });
}

const modal = document.getElementById('remarkModal');
const assignmentIdInput = document.getElementById('assignment_id');

function openRemarkModal(assignmentId) {
    if (modal && assignmentIdInput) {
        assignmentIdInput.value = assignmentId;
        modal.style.display = 'block';
    }
}

function closeRemarkModal() {
    if (modal) {
        modal.style.display = 'none';
    }
}

window.onclick = function(event) {
    if (event.target == modal) {
        closeRemarkModal();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const moduleHeaders = document.querySelectorAll('.module-header');
    moduleHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const module = this.closest('.lecture-module');
            module.classList.toggle('module-active');
        });
    });
    
    if (moduleHeaders.length > 0) {
        const firstModule = moduleHeaders[0].closest('.lecture-module');
        firstModule.classList.add('module-active');
    }
    
    const remarkForm = document.getElementById('remarkForm');
    if (remarkForm) {
        remarkForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const assignmentId = document.getElementById('assignment_id').value;
            const reason = document.getElementById('reason').value;
            
            if (!reason.trim()) {
                alert('Please provide a reason for your remark request');
                return;
            }
            
            fetch('/students/remark', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'assignment_id': assignmentId,
                    'reason': reason
                })
            })
            .then(response => {
                if (response.redirected) {
                    window.location.href = response.url;
                } else {
                    return response.json();
                }
            })
            .then(data => {
                if (data && data.success) {
                    alert('Remark request submitted successfully!');
                    remarkForm.reset();
                    closeRemarkModal();
                    window.location.reload();
                } else if (data) {
                    alert('Error: ' + (data.message || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error submitting remark request');
            });
        });
    }
    
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const instructor_id = document.getElementById('instructor-select').value;
            const teaching_feedback = document.getElementById('teaching-feedback').value;
            const teaching_improvement = document.getElementById('teaching-improvement').value;
            const lab_feedback = document.getElementById('lab-feedback').value;
            const lab_improvement = document.getElementById('lab-improvement').value;
            
            if (!instructor_id || !teaching_feedback || !teaching_improvement || !lab_feedback || !lab_improvement) {
                alert('Please fill out all fields in the feedback form');
                return;
            }
            
            fetch('/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'instructor_id': instructor_id,
                    'teaching_feedback': teaching_feedback,
                    'teaching_improvement': teaching_improvement,
                    'lab_feedback': lab_feedback,
                    'lab_improvement': lab_improvement
                })
            })
            .then(response => {
                if (response.ok) {
                    alert('Feedback submitted successfully!');
                    feedbackForm.reset();
                    window.location.reload(); // Reload to show the flash message
                } else {
                    alert('Error submitting feedback');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error submitting feedback');
            });
        });
    }
    
    const filterButtons = document.querySelectorAll('.filter-button');
    if (filterButtons.length > 0) {
        const remarkCards = document.querySelectorAll('.remark-card');
        const feedbackCards = document.querySelectorAll('.feedback-card');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                const filter = this.getAttribute('data-filter');
                
                if (remarkCards.length > 0) {
                    remarkCards.forEach(card => {
                        if (filter === 'all' || card.getAttribute('data-status') === filter) {
                            card.style.display = 'flex';
                        } else {
                            card.style.display = 'none';
                        }
                    });
                }
                
                if (feedbackCards.length > 0) {
                    feedbackCards.forEach(card => {
                        if (filter === 'all' || card.getAttribute('data-reviewed') === filter) {
                            card.style.display = 'block';
                        } else {
                            card.style.display = 'none';
                        }
                    });
                }
            });
        });
    }
});