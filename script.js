// Parking Management System JavaScript

class ParkingManager {
    constructor(totalSlots = 20) {
        this.totalSlots = totalSlots;
        this.parkingSlots = this.loadParkingData();
        this.selectedSlot = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderParkingGrid();
        this.updateStats();
        this.setDefaultEntryTime();
    }

    // Load parking data from localStorage or initialize
    loadParkingData() {
        const stored = localStorage.getItem('parkingSlots');
        if (stored) {
            return JSON.parse(stored);
        }
        // Initialize empty slots
        return Array.from({ length: this.totalSlots }, (_, index) => ({
            id: index + 1,
            status: 'available',
            vehicleNumber: '',
            ownerName: '',
            vehicleType: '',
            entryTime: ''
        }));
    }

    // Save parking data to localStorage
    saveParkingData() {
        localStorage.setItem('parkingSlots', JSON.stringify(this.parkingSlots));
        this.updateStats();
    }

    // Setup all event listeners
    setupEventListeners() {
        const form = document.getElementById('vehicleForm');
        const clearBtn = document.getElementById('clearBtn');
        const closeTicketModal = document.getElementById('closeTicketModal');
        const closeSlotModal = document.getElementById('closeSlotModal');
        const closeTicketBtn = document.getElementById('closeTicketBtn');
        const closeSlotBtn = document.getElementById('closeSlotBtn');
        const exitVehicleBtn = document.getElementById('exitVehicleBtn');
        const printTicket = document.getElementById('printTicket');

        form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        clearBtn.addEventListener('click', () => this.clearForm());

        // Modal close events
        closeTicketModal.addEventListener('click', () => this.closeTicketModal());
        closeSlotModal.addEventListener('click', () => this.closeSlotModal());
        closeTicketBtn.addEventListener('click', () => this.closeTicketModal());
        closeSlotBtn.addEventListener('click', () => this.closeSlotModal());
        exitVehicleBtn.addEventListener('click', () => this.handleExitVehicle());

        // Close modals when clicking outside
        document.getElementById('ticketModal').addEventListener('click', (e) => {
            if (e.target.id === 'ticketModal') this.closeTicketModal();
        });
        document.getElementById('slotDetailsModal').addEventListener('click', (e) => {
            if (e.target.id === 'slotDetailsModal') this.closeSlotModal();
        });

        // Print ticket
        printTicket.addEventListener('click', () => window.print());

        // Real-time form validation
        document.getElementById('vehicleNumber').addEventListener('input', (e) => 
            this.validateField('vehicleNumber', e.target.value)
        );
        document.getElementById('ownerName').addEventListener('input', (e) => 
            this.validateField('ownerName', e.target.value)
        );
        document.getElementById('vehicleType').addEventListener('change', (e) => 
            this.validateField('vehicleType', e.target.value)
        );
    }

    // Set default entry time to current time
    setDefaultEntryTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('entryTime').value = `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    // Render parking grid
    renderParkingGrid() {
        const grid = document.getElementById('parkingGrid');
        grid.innerHTML = '';

        this.parkingSlots.forEach(slot => {
            const slotElement = document.createElement('div');
            slotElement.className = `parking-slot ${slot.status}`;
            slotElement.dataset.slotId = slot.id;

            if (slot.status === 'occupied') {
                slotElement.innerHTML = `
                    <div class="slot-number">${slot.id}</div>
                    <div class="slot-status">Occupied</div>
                    <div class="slot-vehicle-type">${slot.vehicleType}</div>
                `;
                slotElement.addEventListener('click', () => this.showSlotDetails(slot.id));
            } else {
                const statusText = slot.status === 'selected' ? 'Selected' : 'Available';
                slotElement.innerHTML = `
                    <div class="slot-number">${slot.id}</div>
                    <div class="slot-status">${statusText}</div>
                `;
                slotElement.addEventListener('click', () => this.selectSlot(slot.id));
            }

            grid.appendChild(slotElement);
        });
    }

    // Select a parking slot (toggle selection)
    selectSlot(slotId) {
        const slot = this.parkingSlots.find(s => s.id === slotId);
        
        if (!slot || slot.status === 'occupied') {
            return;
        }

        // If clicking the same selected slot, deselect it
        if (slot.status === 'selected' && this.selectedSlot === slotId) {
            slot.status = 'available';
            this.selectedSlot = null;
            document.getElementById('slotNumber').value = '';
        } else {
            // Remove previous selection
            if (this.selectedSlot && this.selectedSlot !== slotId) {
                const prevSlot = this.parkingSlots.find(s => s.id === this.selectedSlot);
                if (prevSlot && prevSlot.status === 'selected') {
                    prevSlot.status = 'available';
                }
            }

            // Select new slot
            this.selectedSlot = slotId;
            slot.status = 'selected';
            document.getElementById('slotNumber').value = `Slot ${slotId}`;
            
            // Scroll to form
            document.querySelector('.form-section').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest' 
            });
        }
        
        // Update UI
        this.renderParkingGrid();
        this.clearFormErrors();
    }

    // Validate form field
    validateField(fieldName, value) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        let isValid = true;
        let errorMessage = '';

        switch (fieldName) {
            case 'vehicleNumber':
                if (!value.trim()) {
                    errorMessage = 'Vehicle number is required';
                    isValid = false;
                } else if (!/^[A-Z0-9\- ]{3,15}$/i.test(value.trim())) {
                    errorMessage = 'Invalid vehicle number format';
                    isValid = false;
                }
                break;
            case 'ownerName':
                if (!value.trim()) {
                    errorMessage = 'Owner name is required';
                    isValid = false;
                } else if (value.trim().length < 2) {
                    errorMessage = 'Name must be at least 2 characters';
                    isValid = false;
                }
                break;
            case 'vehicleType':
                if (!value) {
                    errorMessage = 'Please select a vehicle type';
                    isValid = false;
                }
                break;
        }

        errorElement.textContent = errorMessage;
        return isValid;
    }

    // Clear form validation errors
    clearFormErrors() {
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
        });
    }

    // Handle form submission
    handleFormSubmit(e) {
        e.preventDefault();

        if (!this.selectedSlot) {
            alert('Please select a parking slot first!');
            return;
        }

        const vehicleNumber = document.getElementById('vehicleNumber').value.trim();
        const ownerName = document.getElementById('ownerName').value.trim();
        const vehicleType = document.getElementById('vehicleType').value;
        const entryTime = document.getElementById('entryTime').value;

        // Validate all fields
        const isVehicleNumberValid = this.validateField('vehicleNumber', vehicleNumber);
        const isOwnerNameValid = this.validateField('ownerName', ownerName);
        const isVehicleTypeValid = this.validateField('vehicleType', vehicleType);

        if (!isVehicleNumberValid || !isOwnerNameValid || !isVehicleTypeValid) {
            return;
        }

        // Book the slot
        this.bookSlot(this.selectedSlot, {
            vehicleNumber,
            ownerName,
            vehicleType,
            entryTime
        });
    }

    // Book a parking slot
    bookSlot(slotId, vehicleData) {
        const slot = this.parkingSlots.find(s => s.id === slotId);
        
        if (!slot || slot.status !== 'selected') {
            alert('Slot is no longer available. Please select another slot.');
            this.selectedSlot = null;
            this.renderParkingGrid();
            return;
        }

        // Update slot data
        slot.status = 'occupied';
        slot.vehicleNumber = vehicleData.vehicleNumber;
        slot.ownerName = vehicleData.ownerName;
        slot.vehicleType = vehicleData.vehicleType;
        slot.entryTime = vehicleData.entryTime;

        // Save to localStorage
        this.saveParkingData();

        // Update UI
        this.renderParkingGrid();
        this.clearForm();
        this.selectedSlot = null;

        // Show ticket modal
        this.showTicket(slot);
    }

    // Show parking ticket
    showTicket(slot) {
        const ticketContent = document.getElementById('ticketContent');
        const entryTime = new Date(slot.entryTime).toLocaleString();

        ticketContent.innerHTML = `
            <div class="ticket">
                <div class="ticket-header">
                    <div class="ticket-title">🅿️ Parking Ticket</div>
                    <div class="ticket-subtitle">Thank you for using our parking service</div>
                </div>
                <div class="ticket-body">
                    <div class="ticket-row">
                        <span class="ticket-label">Slot Number:</span>
                        <span class="ticket-value">${slot.id}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label">Vehicle Number:</span>
                        <span class="ticket-value">${slot.vehicleNumber}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label">Owner Name:</span>
                        <span class="ticket-value">${slot.ownerName}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label">Vehicle Type:</span>
                        <span class="ticket-value">${slot.vehicleType}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label">Entry Time:</span>
                        <span class="ticket-value">${entryTime}</span>
                    </div>
                </div>
                <div class="ticket-footer">
                    Please keep this ticket safe. Present it when exiting.
                </div>
            </div>
        `;

        document.getElementById('ticketModal').classList.add('show');
    }

    // Close ticket modal
    closeTicketModal() {
        document.getElementById('ticketModal').classList.remove('show');
    }

    // Show slot details
    showSlotDetails(slotId) {
        const slot = this.parkingSlots.find(s => s.id === slotId);
        
        if (!slot || slot.status !== 'occupied') {
            return;
        }

        const slotDetailsContent = document.getElementById('slotDetailsContent');
        const entryTime = new Date(slot.entryTime).toLocaleString();

        slotDetailsContent.innerHTML = `
            <div class="slot-details">
                <div class="detail-item">
                    <div class="detail-label">Slot Number</div>
                    <div class="detail-value">${slot.id}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Vehicle Number</div>
                    <div class="detail-value">${slot.vehicleNumber}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Owner Name</div>
                    <div class="detail-value">${slot.ownerName}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Vehicle Type</div>
                    <div class="detail-value">${slot.vehicleType}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Entry Time</div>
                    <div class="detail-value">${entryTime}</div>
                </div>
            </div>
        `;

        document.getElementById('exitVehicleBtn').dataset.slotId = slotId;
        document.getElementById('slotDetailsModal').classList.add('show');
    }

    // Close slot details modal
    closeSlotModal() {
        document.getElementById('slotDetailsModal').classList.remove('show');
    }

    // Handle vehicle exit
    handleExitVehicle() {
        const slotId = parseInt(document.getElementById('exitVehicleBtn').dataset.slotId);
        const slot = this.parkingSlots.find(s => s.id === slotId);

        if (!slot) {
            return;
        }

        // Store vehicle info before clearing
        const vehicleNumber = slot.vehicleNumber;
        const entryTime = new Date(slot.entryTime);
        const exitTime = new Date();
        const duration = Math.round((exitTime - entryTime) / (1000 * 60)); // minutes

        // Confirm exit
        if (confirm(`Are you sure you want to exit vehicle ${vehicleNumber} from Slot ${slotId}?`)) {
            // Clear slot
            slot.status = 'available';
            slot.vehicleNumber = '';
            slot.ownerName = '';
            slot.vehicleType = '';
            slot.entryTime = '';

            // Save to localStorage
            this.saveParkingData();

            // Update UI
            this.renderParkingGrid();
            this.closeSlotModal();

            // Show confirmation
            alert(`Vehicle ${vehicleNumber} has exited successfully.\nParking Duration: ${duration} minutes`);
        }
    }

    // Clear form
    clearForm() {
        document.getElementById('vehicleForm').reset();
        document.getElementById('slotNumber').value = '';
        this.clearFormErrors();
        this.setDefaultEntryTime();
        
        // Clear selection
        if (this.selectedSlot) {
            const slot = this.parkingSlots.find(s => s.id === this.selectedSlot);
            if (slot && slot.status === 'selected') {
                slot.status = 'available';
                this.renderParkingGrid();
            }
            this.selectedSlot = null;
        }
    }

    // Update statistics
    updateStats() {
        const available = this.parkingSlots.filter(s => s.status === 'available').length;
        const occupied = this.parkingSlots.filter(s => s.status === 'occupied').length;

        document.getElementById('totalSlots').textContent = this.totalSlots;
        document.getElementById('availableSlots').textContent = available;
        document.getElementById('occupiedSlots').textContent = occupied;
    }
}

// Initialize the parking management system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const parkingManager = new ParkingManager(20);
    
    // Make it globally available for debugging (optional)
    window.parkingManager = parkingManager;
});

