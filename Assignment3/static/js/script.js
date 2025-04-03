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
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
            assignment_id: assignmentId,
            reason: reason
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const successMessage = document.createElement('div');
            successMessage.className = 'flash-message success';
            successMessage.innerHTML = 'Remark request submitted successfully!';
            
            const container = document.querySelector('.marks-content') || 
                              document.querySelector('.marks-header') ||
                              document.querySelector('main');
                              
            if (container) {
                container.insertBefore(successMessage, container.firstChild);
                successMessage.scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => {
                    successMessage.remove();
                }, 5000);
            }
            
            const remarkSection = document.getElementById(`remark-section-${assignmentId}`);
            if (remarkSection) {
                remarkSection.innerHTML = `
                    <div class="alert alert-success">
                        Remark request submitted successfully!
                        <br>
                        Status: <span class="badge badge-pending">Pending</span>
                    </div>
                `;
            }
            
            const statusCell = document.querySelector(`tr[data-assignment="${assignmentId}"] td:nth-child(4)`);
            const actionCell = document.querySelector(`tr[data-assignment="${assignmentId}"] td:nth-child(5)`);
            
            if (statusCell) {
                statusCell.innerHTML = `<span class="remark-status pending">Pending</span>`;
            }
            
            if (actionCell) {
                actionCell.innerHTML = `<button class="button small-button" disabled>Request Submitted</button>`;
            }
            
            closeRemarkModal();
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
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const feedbackForm = document.getElementById('feedbackForm');
            const feedbackContainer = document.getElementById('feedback-container') || document.querySelector('.feedback-form-section');
            
            if (feedbackForm) {
                feedbackForm.reset();
            }
            
            if (feedbackContainer) {
                const successMessage = document.createElement('div');
                successMessage.className = 'flash-message success';
                successMessage.innerHTML = 'Your feedback has been submitted successfully!';
                
                feedbackContainer.insertBefore(successMessage, feedbackContainer.firstChild);
                successMessage.scrollIntoView({ behavior: 'smooth' });
                
                setTimeout(() => {
                    successMessage.remove();
                }, 5000);
            } else {
                alert('Feedback submitted successfully!');
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
    const markInput = document.getElementById(`mark-${studentId}-${assignmentId}`);
    const mark = markInput.value;
    
    if (!mark.trim()) {
        alert('Please enter a valid mark');
        return;
    }
    
    fetch('/update-mark', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
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
            const successMessage = document.createElement('div');
            successMessage.className = 'flash-message success';
            successMessage.innerHTML = 'Mark updated successfully!';
            
            const container = document.querySelector('.marks-header') || 
                              document.querySelector('.enter-marks-section') ||
                              document.querySelector('main');
                              
            if (container) {
                container.insertBefore(successMessage, container.firstChild);
                successMessage.scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => {
                    successMessage.remove();
                }, 5000);
            }
            
            const markCell = document.getElementById(`mark-cell-${studentId}-${assignmentId}`);
            
            if (markCell) {
                const maxMark = markCell.getAttribute('data-max-mark');
                let displayText = mark;
                
                if (maxMark) {
                    const percentage = ((mark / maxMark) * 100).toFixed(1);
                    displayText = `${mark} (${percentage}%)`;
                }
                
                markCell.innerHTML = displayText;
                
                const notification = document.createElement('span');
                notification.className = 'update-notification';
                notification.textContent = ' ✓ Updated';
                notification.style.color = 'green';
                notification.style.fontWeight = 'bold';
                markCell.appendChild(notification);
                
                setTimeout(() => {
                    notification.remove();
                }, 3000);
            }
            
            const messageContainer = document.getElementById('update-message');
            if (messageContainer) {
                messageContainer.innerHTML = '<div class="flash-message success">Mark updated successfully!</div>';
                
                setTimeout(() => {
                    messageContainer.innerHTML = '';
                }, 3000);
            }
            
            markInput.value = mark;
            markInput.blur();
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
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
            request_id: requestId,
            status: newStatus
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const remarkCard = document.querySelector(`.remark-card[data-request-id="${requestId}"]`) || 
                              document.querySelector(`.remark-card[data-status]`);
            
            if (remarkCard) {
                remarkCard.setAttribute('data-status', newStatus);
                remarkCard.classList.remove('pending', 'approved', 'rejected');
                remarkCard.classList.add(newStatus.toLowerCase());
                
                const statusBadge = remarkCard.querySelector('.status-badge');
                if (statusBadge) {
                    statusBadge.className = `status-badge ${newStatus.toLowerCase()}`;
                    statusBadge.textContent = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
                }
                
                const remarkActions = remarkCard.querySelector('.remark-actions');
                if (remarkActions) {
                    let actionsHtml = `<div class="status-badge ${newStatus}">${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</div>`;
                    
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
                
                const successMessage = document.createElement('div');
                successMessage.className = 'flash-message success';
                successMessage.innerHTML = `Request status updated to "${newStatus}" successfully!`;
                
                const container = document.querySelector('.remark-header') || 
                                 document.querySelector('.remark-content') ||
                                 document.querySelector('main');
                                 
                if (container) {
                    container.insertBefore(successMessage, container.firstChild);
                    successMessage.scrollIntoView({ behavior: 'smooth' });
                    setTimeout(() => {
                        successMessage.remove();
                    }, 5000);
                }
                
                const messageContainer = document.getElementById('update-message');
                if (messageContainer) {
                    messageContainer.innerHTML = `<div class="flash-message success">Request status updated to "${newStatus}" successfully!</div>`;
                    
                    setTimeout(() => {
                        messageContainer.innerHTML = '';
                    }, 3000);
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
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
            feedback_id: feedbackId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const feedbackCard = document.querySelector(`.feedback-card[data-feedback-id="${feedbackId}"]`) || 
                               document.getElementById(`feedback-${feedbackId}`);
            
            if (feedbackCard) {
                feedbackCard.setAttribute('data-reviewed', 'true');
                
                const statusBadge = feedbackCard.querySelector('.status-badge');
                if (statusBadge) {
                    statusBadge.className = 'status-badge reviewed';
                    statusBadge.textContent = 'Reviewed';
                }
                
                const reviewButton = feedbackCard.querySelector('button') || 
                                    document.getElementById(`review-button-${feedbackId}`);
                const actionArea = feedbackCard.querySelector('.feedback-actions');
                
                if (reviewButton) {
                    reviewButton.innerHTML = '<span class="badge badge-success">Reviewed</span>';
                    reviewButton.disabled = true;
                } else if (actionArea) {
                    actionArea.innerHTML = '<span class="reviewed-badge">Reviewed</span>';
                }
                
                const successMessage = document.createElement('div');
                successMessage.className = 'flash-message success';
                successMessage.innerHTML = 'Feedback marked as reviewed!';
                
                const container = document.querySelector('.feedback-header') || 
                                 document.querySelector('.feedback-content') ||
                                 document.querySelector('main');
                                 
                if (container) {
                    container.insertBefore(successMessage, container.firstChild);
                    successMessage.scrollIntoView({ behavior: 'smooth' });
                    setTimeout(() => {
                        successMessage.remove();
                    }, 5000);
                }
                
                const messageContainer = document.getElementById('update-message');
                if (messageContainer) {
                    messageContainer.innerHTML = '<div class="flash-message success">Feedback marked as reviewed!</div>';
                    
                    setTimeout(() => {
                        messageContainer.innerHTML = '';
                    }, 3000);
                }
            }
        } else {
            alert('Failed to mark feedback as reviewed: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while marking the feedback as reviewed');
    });
}

function openRemarkModal(assignmentId) {
    const modal = document.getElementById('remarkModal');
    const assignmentIdInput = document.getElementById('assignment_id');
    
    if (modal && assignmentIdInput) {
        assignmentIdInput.value = assignmentId;
        modal.style.display = 'block';
        
        setTimeout(() => {
            const reasonTextarea = document.getElementById('reason');
            if (reasonTextarea) {
                reasonTextarea.focus();
            }
        }, 100);
    }
}

function closeRemarkModal() {
    const modal = document.getElementById('remarkModal');
    if (modal) {
        modal.style.display = 'none';
        
        const remarkForm = document.getElementById('remarkForm');
        if (remarkForm) {
            remarkForm.reset();
        }
    }
}

window.onclick = function(event) {
    const modal = document.getElementById('remarkModal');
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
            
            const arrow = this.querySelector('.arrow');
            if (arrow) {
                arrow.textContent = module.classList.contains('module-active') ? '▼' : '▶';
            }
        });
    });
    
    if (moduleHeaders.length > 0) {
        const firstModule = moduleHeaders[0].closest('.lecture-module');
        firstModule.classList.add('module-active');
        
        const arrow = firstModule.querySelector('.arrow');
        if (arrow) {
            arrow.textContent = '▼';
        }
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
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: new URLSearchParams({
                    'assignment_id': assignmentId,
                    'reason': reason
                })
            })
            .then(response => {
                if (response.headers.get('content-type')?.includes('application/json')) {
                    return response.json();
                } else if (response.redirected) {
                    window.location.href = response.url;
                    return null;
                } else {
                    return response.text().then(text => {
                        return { success: false, message: text };
                    });
                }
            })
            .then(data => {
                if (data === null) {
                    return;
                }
                
                if (data && data.success) {
                    const successMessage = document.createElement('div');
                    successMessage.className = 'flash-message success';
                    successMessage.innerHTML = 'Remark request submitted successfully!';
                    
                    const container = document.querySelector('.marks-header') || 
                                      document.querySelector('.marks-content') ||
                                      document.querySelector('main');
                                      
                    if (container) {
                        container.insertBefore(successMessage, container.firstChild);
                        successMessage.scrollIntoView({ behavior: 'smooth' });
                        setTimeout(() => {
                            successMessage.remove();
                        }, 5000);
                    }
                    
                    const row = document.querySelector(`tr[data-assignment="${assignmentId}"]`);
                    if (row) {
                        const statusCell = row.querySelector('td:nth-child(4)');
                        const actionCell = row.querySelector('td:nth-child(5)');
                        
                        if (statusCell) {
                            statusCell.innerHTML = `<span class="remark-status pending">Pending</span>`;
                        }
                        
                        if (actionCell) {
                            actionCell.innerHTML = `<button class="button small-button" disabled>Request Submitted</button>`;
                        }
                    }
                    
                    remarkForm.reset();
                    closeRemarkModal();
                    return false;
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
                    'X-Requested-With': 'XMLHttpRequest'
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
                if (response.headers.get('content-type')?.includes('application/json')) {
                    return response.json();
                } else if (response.ok) {
                    const successMessage = document.createElement('div');
                    successMessage.className = 'flash-message success';
                    successMessage.innerHTML = 'Feedback submitted successfully!';
                    
                    const container = document.querySelector('.feedback-form-section');
                    if (container) {
                        container.insertBefore(successMessage, container.firstChild);
                        successMessage.scrollIntoView({ behavior: 'smooth' });
                        setTimeout(() => {
                            successMessage.remove();
                        }, 5000);
                    } else {
                        alert('Feedback submitted successfully!');
                    }
                    
                    feedbackForm.reset();
                    
                    return null;
                } else {
                    alert('Error submitting feedback');
                    return null;
                }
            })
            .then(data => {
                if (data && data.success) {
                    const successMessage = document.createElement('div');
                    successMessage.className = 'flash-message success';
                    successMessage.innerHTML = 'Feedback submitted successfully!';
                    
                    const container = document.querySelector('.feedback-form-section');
                    if (container) {
                        container.insertBefore(successMessage, container.firstChild);
                        successMessage.scrollIntoView({ behavior: 'smooth' });
                        setTimeout(() => {
                            successMessage.remove();
                        }, 5000);
                    } else {
                        alert('Feedback submitted successfully!');
                    }
                    
                    feedbackForm.reset();
                } else if (data) {
                    alert('Error: ' + (data.message || 'Unknown error'));
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
    
    const markRows = document.querySelectorAll('.marks-table tbody tr');
    markRows.forEach(row => {
        const requestButton = row.querySelector('button[onclick^="openRemarkModal"]');
        if (requestButton) {
            const onclick = requestButton.getAttribute('onclick');
            const assignmentId = onclick.match(/openRemarkModal\('(.+?)'\)/)[1];
            row.setAttribute('data-assignment', assignmentId);
        }
    });
    
    const markCells = document.querySelectorAll('[id^="mark-cell-"]');
    markCells.forEach(cell => {
        const markText = cell.textContent.trim();
        const markMatch = markText.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
        
        if (markMatch && markMatch[2]) {
            cell.setAttribute('data-max-mark', markMatch[2]);
        }
    });
    
    const markInputs = document.querySelectorAll('input[id^="mark-"]');
    markInputs.forEach(input => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                
                const idParts = this.id.split('-');
                if (idParts.length === 3) {
                    updateMark(idParts[1], idParts[2]);
                }
            }
        });
    });
});