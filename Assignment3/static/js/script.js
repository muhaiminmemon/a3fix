// Dynamic form submission for remark requests
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
            // Update the UI
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

// Dynamic form submission for feedback
function submitFeedback() {
    const formData = {
        instructor_id: document.getElementById('instructor-select').value,
        teaching_feedback: document.getElementById('teaching-feedback').value,
        teaching_improvement: document.getElementById('teaching-improvement').value,
        lab_feedback: document.getElementById('lab-feedback').value,
        lab_improvement: document.getElementById('lab-improvement').value
    };

    // Validate form
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
            // Clear form and show success message
            document.getElementById('feedback-form').reset();
            const feedbackContainer = document.getElementById('feedback-container');
            feedbackContainer.innerHTML = `
                <div class="alert alert-success">
                    Your feedback has been submitted successfully!
                </div>
            `;
        } else {
            alert('Failed to submit feedback: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while submitting the feedback');
    });
}

// Dynamic update of marks by instructor
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
            // Update the UI
            const markCell = document.getElementById(`mark-cell-${studentId}-${assignmentId}`);
            markCell.innerHTML = `
                <span class="mark-value">${mark}</span>
                <span class="badge badge-success">Updated</span>
            `;
            
            // Show success message
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

// Dynamic update of remark request status
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
            // Find the remark card
            const remarkCard = document.querySelector(`.remark-card[data-request-id="${requestId}"]`);
            if (remarkCard) {
                // Remove old status classes
                remarkCard.classList.remove('pending', 'approved', 'rejected');
                // Add new status class
                remarkCard.classList.add(newStatus.toLowerCase());
                
                // Update status badge
                const statusBadge = remarkCard.querySelector('.status-badge');
                if (statusBadge) {
                    statusBadge.className = `status-badge ${newStatus.toLowerCase()}`;
                    statusBadge.textContent = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
                }
                
                // Update action buttons based on new status
                const remarkActions = remarkCard.querySelector('.remark-actions');
                if (remarkActions) {
                    // Keep the status badge
                    const badgeHtml = `<div class="status-badge ${newStatus}">${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</div>`;
                    
                    // Create appropriate action buttons
                    let actionsHtml = badgeHtml;
                    
                    // Only show approve button if status is not approved
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
                    
                    // Only show reject button if status is not rejected
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
                    
                    // Show reset to pending button only if status is not pending
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

// Dynamic update of feedback review status
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
            // Update the UI
            const feedbackRow = document.getElementById(`feedback-${feedbackId}`);
            feedbackRow.classList.add('reviewed');
            
            // Update the review button
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

const remarkForm = document.getElementById('remarkForm');
if (remarkForm) {
    remarkForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        
        fetch('/submit_remark', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Remark request submitted successfully!');
                remarkForm.reset();
                location.reload();
            } else {
                alert('Error submitting remark request: ' + data.message);
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
        
        const formData = new FormData(this);
        
        fetch('/submit_feedback', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Feedback submitted successfully!');
                feedbackForm.reset();
            } else {
                alert('Error submitting feedback: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error submitting feedback');
        });
    });
}

const markForm = document.getElementById('markForm');
if (markForm) {
    markForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        
        fetch('/update_mark', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Mark updated successfully!');
                location.reload();
            } else {
                alert('Error updating mark: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error updating mark');
        });
    });
}

const statusForm = document.getElementById('statusForm');
if (statusForm) {
    statusForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        
        fetch('/update_remark_status', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const remarkCard = document.querySelector(`[data-request-id="${data.request_id}"]`);
                if (remarkCard) {
                    remarkCard.classList.remove('pending', 'approved', 'rejected');
                    remarkCard.classList.add(data.new_status);
                    
                    const statusBadge = remarkCard.querySelector('.status-badge');
                    if (statusBadge) {
                        statusBadge.textContent = data.new_status.charAt(0).toUpperCase() + data.new_status.slice(1);
                        statusBadge.className = 'status-badge ' + data.new_status;
                    }
                    
                    const actionsDiv = remarkCard.querySelector('.remark-actions');
                    if (actionsDiv) {
                        actionsDiv.innerHTML = '';
                        
                        if (data.new_status === 'pending') {
                            const approveBtn = document.createElement('button');
                            approveBtn.className = 'action-button approve';
                            approveBtn.textContent = 'Approve';
                            approveBtn.setAttribute('data-request-id', data.request_id);
                            
                            const rejectBtn = document.createElement('button');
                            rejectBtn.className = 'action-button reject';
                            rejectBtn.textContent = 'Reject';
                            rejectBtn.setAttribute('data-request-id', data.request_id);
                            
                            actionsDiv.appendChild(approveBtn);
                            actionsDiv.appendChild(rejectBtn);
                        } else {
                            const resetBtn = document.createElement('button');
                            resetBtn.className = 'action-button reset';
                            resetBtn.textContent = 'Reset to Pending';
                            resetBtn.setAttribute('data-request-id', data.request_id);
                            actionsDiv.appendChild(resetBtn);
                        }
                    }
                }
                alert('Status updated successfully!');
            } else {
                alert('Error updating status: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error updating status');
        });
    });
}

const reviewForm = document.getElementById('reviewForm');
if (reviewForm) {
    reviewForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        
        fetch('/update_feedback_status', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const feedbackCard = document.querySelector(`[data-feedback-id="${data.feedback_id}"]`);
                if (feedbackCard) {
                    feedbackCard.setAttribute('data-status', data.new_status);
                    
                    const statusBadge = feedbackCard.querySelector('.status-badge');
                    if (statusBadge) {
                        statusBadge.textContent = data.new_status.charAt(0).toUpperCase() + data.new_status.slice(1);
                        statusBadge.className = 'status-badge ' + data.new_status;
                    }
                    
                    const reviewBtn = feedbackCard.querySelector('.action-button');
                    if (reviewBtn) {
                        if (data.new_status === 'reviewed') {
                            reviewBtn.textContent = 'Mark as Unreviewed';
                            reviewBtn.className = 'action-button unreview';
                        } else {
                            reviewBtn.textContent = 'Mark as Reviewed';
                            reviewBtn.className = 'action-button review';
                        }
                    }
                }
                alert('Status updated successfully!');
            } else {
                alert('Error updating status: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error updating status');
        });
    });
}