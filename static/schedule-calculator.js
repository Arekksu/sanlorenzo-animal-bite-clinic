// Schedule date calculator
document.addEventListener('DOMContentLoaded', function() {
    // Get all date input fields
    const day0Input = document.querySelector('input[name="day0"]');
    const scheduleInputs = {
        day3: document.querySelector('input[name="day3"]'),
        day7: document.querySelector('input[name="day7"]'),
        day14: document.querySelector('input[name="day14"]'),
        day28: document.querySelector('input[name="day28"]')
    };

    // Function to add days to a date
    function addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    // Function to format date as YYYY-MM-DD
    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    // Calculate and set all schedule dates based on Day 0
    function calculateSchedule(startDate) {
        if (!startDate) {
            // Clear all schedule inputs if Day 0 is cleared
            Object.values(scheduleInputs).forEach(input => {
                if (input) {
                    input.value = '';
                    input.style.backgroundColor = '';
                }
            });
            return;
        }

        const day0 = new Date(startDate);
        const daysToAdd = { day3: 3, day7: 7, day14: 14, day28: 28 };

        // Calculate and set dates for each schedule input
        Object.entries(daysToAdd).forEach(([key, days]) => {
            const input = scheduleInputs[key];
            if (input) {
                const calculatedDate = addDays(day0, days);
                input.value = formatDate(calculatedDate);

                // Visual feedback for auto-calculation
                input.style.backgroundColor = '#f0f8ff'; // Light blue background
                input.style.transition = 'background-color 0.5s ease';
                
                setTimeout(() => {
                    input.style.backgroundColor = '';
                }, 800);
            }
        });
    }

    // Event listener for Day 0 date changes
    if (day0Input) {
        // Set min date to prevent past dates
        const today = new Date();
        day0Input.min = formatDate(today);
        
        day0Input.addEventListener('change', function() {
            calculateSchedule(this.value);
        });

        // Calculate initial schedule if Day 0 already has a value
        if (day0Input.value) {
            calculateSchedule(day0Input.value);
        }

        // Mark other inputs as read-only
        Object.values(scheduleInputs).forEach(input => {
            if (input) {
                input.readOnly = true;
            }
        });
    }
});