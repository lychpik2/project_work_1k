const app = {
  data: [],
  currentBooking: null,
  bookingStep: 1,

  init: function() {
    this.parseXML();
    this.setupDates();
    this.bindEvents();
    console.log('🚀 SkyWings App Started');
  },

  parseXML: function() {
    fetch('data/data.xml')
      .then(response => {
        if (!response.ok) throw new Error('XML file not found');
        return response.text();
      })
      .then(xmlStr => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlStr, "text/xml");
        
        if (xmlDoc.querySelector('parsererror')) {
          console.error('XML parsing error');
          this.loadFallbackData();
          return;
        }
        
        const destNodes = xmlDoc.getElementsByTagName('city');
        for(let i = 0; i < destNodes.length; i++) {
          this.data.push({
            name: destNodes[i].getAttribute('name')?.trim(),
            country: destNodes[i].getAttribute('country')?.trim(),
            region: destNodes[i].getAttribute('region')?.trim(),
            price: destNodes[i].getAttribute('price')?.trim(),
            flights: destNodes[i].getAttribute('flights')?.trim(),
            img: destNodes[i].getAttribute('img')?.trim(),
            desc: destNodes[i].textContent?.trim()
          });
        }
        
        this.renderDestinations(this.data.slice(0, 3), 'home-dest-grid');
        this.renderDestinations(this.data, 'dest-grid');
        this.populateDatalist();
        this.renderBookings();
      })
      .catch(error => {
        console.error('Error loading XML:', error);
        this.loadFallbackData();
      });
  },

  loadFallbackData: function() {
    this.data = [
      { name: 'Paris', country: 'France', region: 'Europe', price: 599, flights: 24, img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop', desc: 'The City of Light' },
      { name: 'Minsk', country: 'Belarus', region: 'Europe', price: 449, flights: 12, img: 'https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=600&h=400&fit=crop', desc: 'Beautiful architecture' },
      { name: 'New York', country: 'USA', region: 'North America', price: 489, flights: 32, img: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&h=400&fit=crop', desc: 'The Big Apple' }
    ];
    this.renderDestinations(this.data.slice(0, 3), 'home-dest-grid');
    this.renderDestinations(this.data, 'dest-grid');
    this.populateDatalist();
    this.renderBookings();
  },

  nav: function(pageId) {
    const pageMap = {
      'home': 'index.html',
      'book': 'book.html',
      'status': 'status.html',
      'destinations': 'destinations.html',
      'bookings': 'bookings.html',
      'about': 'about.html',
      'signin': 'signin.html',
      '404': '404.html'
    };
    window.location.href = pageMap[pageId] || 'index.html';
  },

  resetBookingView: function() {
    this.currentBooking = null;
    this.bookingStep = 1;
    const container = document.getElementById('booking-content');
    if (container) {
      container.innerHTML = `
        <form class="booking-form" onsubmit="event.preventDefault(); app.search();">
          <div class="form-group"><label>From</label><input type="text" id="bookFrom" list="city-list" placeholder="Departure"></div>
          <div class="form-group"><label>To</label><input type="text" id="bookTo" list="city-list" placeholder="Destination"></div>
          <div class="form-group"><label>Departure</label><input type="date" id="bookDepart"></div>
          <div class="form-group"><label>Return</label><input type="date" id="bookReturn"></div>
          <div class="form-group"><label>Passengers</label><select id="bookPassengers"><option>1</option><option>2</option><option>3</option><option>4</option></select></div>
          <div class="form-group"><label>Class</label><select id="bookClass"><option>Economy</option><option>Business</option></select></div>
          <button type="submit" class="btn btn-primary">Search Flights</button>
        </form>
      `;
      this.setupDates();
    }
  },

  renderDestinations: function(items, containerId) {
    const container = document.getElementById(containerId);
    if(!container) return;
    container.innerHTML = items.map(item => `
      <article class="dest-card">
        <figure>
          <img src="${this.escapeHtml(item.img)}" alt="${this.escapeHtml(item.name)}" loading="lazy">
          <span class="price-tag">From $${this.escapeHtml(item.price)}</span>
        </figure>
        <div class="card-body">
          <h3>${this.escapeHtml(item.name)} <span>${this.escapeHtml(item.country)}</span></h3>
          <p>${this.escapeHtml(item.desc)}</p>
          <div class="meta">
            <span>✈ ${this.escapeHtml(item.flights)} daily flights</span>
            <span class="tag">${this.escapeHtml(item.region)}</span>
          </div>
          <button class="find-flight-btn" data-dest="${this.escapeHtml(item.name)}">Find Flights</button>
        </div>
      </article>
    `).join('');
    
    document.querySelectorAll('.find-flight-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dest = e.currentTarget.getAttribute('data-dest');
        sessionStorage.setItem('quick_dest', dest);
        this.nav('book');
      });
    });
  },

  escapeHtml: function(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
      return m === '&' ? '&amp;' : m === '<' ? '&lt;' : m === '>' ? '&gt;' : m;
    });
  },

  populateDatalist: function() {
    const list = document.getElementById('city-list');
    if (list) list.innerHTML = this.data.map(d => `<option value="${d.name} (${d.country})">`).join('');
  },

  filterRegion: function(region) {
    const filtered = region === 'all' ? this.data : this.data.filter(d => d.region === region);
    this.renderDestinations(filtered, 'dest-grid');
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-region') === region);
    });
  },

  filterDest: function(query) {
    const q = query.toLowerCase();
    const filtered = this.data.filter(d => d.name.toLowerCase().includes(q) || d.country.toLowerCase().includes(q));
    this.renderDestinations(filtered, 'dest-grid');
  },

  toggleTab: function(btn) {
    document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
  },

  checkStatus: function() {
    const num = document.getElementById('statusNum')?.value?.trim();
    const res = document.getElementById('status-result');
    if (!res) return;
    
    if (!num) {
      alert('Please enter a flight number');
      return;
    }
    
    res.style.display = 'block';
    res.innerHTML = `
      <div style="background:#E8F4FD; padding:16px; border-radius:10px; border-left: 4px solid #0066CC;">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
          <strong>${this.escapeHtml(num)}</strong>
          <span style="background:#dcfce7; color:#166534; padding:2px 8px; border-radius:10px; font-size:12px; font-weight:600;">On Time</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:13px; color:#6B7280;">
          <span>🛫 ${this.escapeHtml(num)} - 08:00</span>
          <span>🛬 London - 20:30</span>
        </div>
      </div>
    `;
  },

  search: function() {
    const from = document.getElementById('homeFrom')?.value || document.getElementById('bookFrom')?.value;
    const to = document.getElementById('homeTo')?.value || document.getElementById('bookTo')?.value;
    const depart = document.getElementById('homeDepart')?.value || document.getElementById('bookDepart')?.value;
    const returnDate = document.getElementById('homeReturn')?.value || document.getElementById('bookReturn')?.value;
    const travelClass = document.getElementById('homeClass')?.value || document.getElementById('bookClass')?.value || 'Economy';
    const passengers = document.getElementById('homePassengers')?.value || document.getElementById('bookPassengers')?.value || '1';
    
    if (!from || !to) {
      alert('Please enter departure and destination cities');
      return;
    }
    
    this.currentBooking = { from, to, depart, returnDate, travelClass, passengers };
    sessionStorage.setItem('search_data', JSON.stringify(this.currentBooking));
    window.location.href = 'book.html';
  },

  displaySearchResults: function() {
    const savedSearch = sessionStorage.getItem('search_data');
    const quickDest = sessionStorage.getItem('quick_dest');
    
    if (savedSearch) {
      const data = JSON.parse(savedSearch);
      this.currentBooking = data;
      
      if (document.getElementById('bookFrom')) document.getElementById('bookFrom').value = data.from;
      if (document.getElementById('bookTo')) document.getElementById('bookTo').value = data.to;
      if (document.getElementById('bookDepart')) document.getElementById('bookDepart').value = data.depart;
      if (document.getElementById('bookReturn')) document.getElementById('bookReturn').value = data.returnDate;
      if (document.getElementById('bookPassengers')) document.getElementById('bookPassengers').value = data.passengers;
      if (document.getElementById('bookClass')) document.getElementById('bookClass').value = data.travelClass;
      
      sessionStorage.removeItem('search_data');
      this.showBookingStep(1, this.currentBooking);
    } else if (quickDest && document.getElementById('bookTo')) {
      document.getElementById('bookTo').value = quickDest;
      sessionStorage.removeItem('quick_dest');
    }
  },

  showBookingStep: function(step, data) {
    this.bookingStep = step;
    this.currentBooking = data || this.currentBooking;
    
    const container = document.getElementById('booking-content');
    if (!container) return;
    
    if (step === 1) {
      this.renderFlightSelection(container);
    } else if (step === 2) {
      this.renderPassengerDetails(container);
    } else if (step === 3) {
      this.renderConfirmation(container);
    }
  },

  renderFlightSelection: function(container) {
    const { from, to, travelClass } = this.currentBooking;
    
    const mockFlights = [
      { number: 'SW' + Math.floor(Math.random() * 900 + 100), from, to, depart: '08:00', arrive: '16:30', duration: '8h 30m', price: Math.floor(Math.random() * 400 + 300), stops: 'Non-stop' },
      { number: 'SW' + Math.floor(Math.random() * 900 + 100), from, to, depart: '14:00', arrive: '23:00', duration: '9h 00m', price: Math.floor(Math.random() * 300 + 250), stops: '1 Stop' }
    ];
    
    let html = `
      <div class="booking-steps">
        <div class="step active"><div class="step-number">1</div><div class="step-label">Select Flight</div></div>
        <div class="step"><div class="step-number">2</div><div class="step-label">Passenger Details</div></div>
        <div class="step"><div class="step-number">3</div><div class="step-label">Confirmation</div></div>
      </div>
      <div class="flight-results">
        <h3 style="margin-bottom: 16px;">Available Flights: ${this.escapeHtml(from)} → ${this.escapeHtml(to)}</h3>
    `;
    
    for (const f of mockFlights) {
      html += `
        <div class="flight-card">
          <div class="flight-header">
            <span class="flight-number">${this.escapeHtml(f.number)} • ${this.escapeHtml(f.stops)}</span>
            <span class="flight-price">$${f.price}</span>
          </div>
          <div class="flight-route">
            <div class="route-point">
              <div class="time">${this.escapeHtml(f.depart)}</div>
              <div class="city">${this.escapeHtml(f.from)}</div>
            </div>
            <div class="route-line">
              <div class="duration">${this.escapeHtml(f.duration)}</div>
              <div class="line"></div>
            </div>
            <div class="route-point">
              <div class="time">${this.escapeHtml(f.arrive)}</div>
              <div class="city">${this.escapeHtml(f.to)}</div>
            </div>
          </div>
          <div class="flight-details">
            <span>Class: ${this.escapeHtml(travelClass || 'Economy')}</span>
            <button class="select-btn" onclick="app.selectFlight(${f.price}, '${this.escapeHtml(f.number)}')">Select Flight</button>
          </div>
        </div>
      `;
    }
    
    html += `</div>`;
    container.innerHTML = html;
  },

  selectFlight: function(price, flightNumber) {
    this.currentBooking.price = price;
    this.currentBooking.flightNumber = flightNumber;
    this.showBookingStep(2, this.currentBooking);
  },

  renderPassengerDetails: function(container) {
    container.innerHTML = `
      <div class="booking-steps">
        <div class="step completed"><div class="step-number">✓</div><div class="step-label">Select Flight</div></div>
        <div class="step active"><div class="step-number">2</div><div class="step-label">Passenger Details</div></div>
        <div class="step"><div class="step-number">3</div><div class="step-label">Confirmation</div></div>
      </div>
      <div style="max-width: 500px; margin: 0 auto;">
        <h3 style="margin-bottom: 20px;">Passenger Details</h3>
        <div class="form-group">
          <label>Full Name *</label>
          <input type="text" id="passengerName" placeholder="As shown on passport" required>
        </div>
        <div class="form-group">
          <label>Email Address *</label>
          <input type="email" id="passengerEmail" placeholder="For confirmation email" required>
        </div>
        <div class="form-group">
          <label>Phone Number</label>
          <input type="tel" id="passengerPhone" placeholder="+1 (555) 000-0000">
        </div>
        <div class="form-group">
          <label>Passport Number *</label>
          <input type="text" id="passengerPassport" placeholder="Passport number" required>
        </div>
        <div style="display: flex; gap: 12px; margin-top: 24px;">
          <button class="btn btn-outline" onclick="app.showBookingStep(1, app.currentBooking)" style="flex: 1;">← Back</button>
          <button class="btn btn-primary" onclick="app.proceedToConfirmation()" style="flex: 2;">Continue to Confirmation →</button>
        </div>
      </div>
    `;
  },

  proceedToConfirmation: function() {
    const name = document.getElementById('passengerName')?.value?.trim();
    const email = document.getElementById('passengerEmail')?.value?.trim();
    const passport = document.getElementById('passengerPassport')?.value?.trim();
    
    if (!name || !email || !passport) {
      alert('Please fill in all required fields (*)');
      return;
    }
    
    this.currentBooking.passengerName = name;
    this.currentBooking.passengerEmail = email;
    this.currentBooking.passengerPhone = document.getElementById('passengerPhone')?.value?.trim() || '';
    this.currentBooking.passengerPassport = passport;
    
    this.showBookingStep(3, this.currentBooking);
  },

  renderConfirmation: function(container) {
    const b = this.currentBooking;
    container.innerHTML = `
      <div class="booking-steps">
        <div class="step completed"><div class="step-number">✓</div><div class="step-label">Select Flight</div></div>
        <div class="step completed"><div class="step-number">✓</div><div class="step-label">Passenger Details</div></div>
        <div class="step active"><div class="step-number">3</div><div class="step-label">Confirmation</div></div>
      </div>
      <div style="max-width: 500px; margin: 0 auto; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">✈️</div>
        <h3 style="margin-bottom: 8px;">Review Your Booking</h3>
        <p style="color: #6B7280; margin-bottom: 24px;">Please review all details before confirming</p>
        
        <div style="background: #F9FAFB; border-radius: 14px; padding: 20px; text-align: left; margin-bottom: 24px;">
          <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #E5E7EB;">
            <strong style="color: #0066CC;">${this.escapeHtml(b.flightNumber)}</strong>
            <span style="float: right; font-weight: 700; color: #0066CC; font-size: 18px;">$${b.price}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <div><strong>${this.escapeHtml(b.from)}</strong><br><small style="color: #6B7280;">${this.escapeHtml(b.depart)}</small></div>
            <div style="color: #0066CC;">✈ →</div>
            <div style="text-align: right;"><strong>${this.escapeHtml(b.to)}</strong><br><small style="color: #6B7280;">${this.escapeHtml(b.arrive || 'TBD')}</small></div>
          </div>
          <div style="font-size: 13px; color: #6B7280; margin-top: 12px; padding-top: 12px; border-top: 1px solid #E5E7EB;">
            👤 ${this.escapeHtml(b.passengerName)}<br>
            📧 ${this.escapeHtml(b.passengerEmail)}<br>
            🛂 Passport: ${this.escapeHtml(b.passengerPassport)}
          </div>
        </div>
        
        <div style="display: flex; gap: 12px;">
          <button class="btn btn-outline" onclick="app.showBookingStep(2, app.currentBooking)" style="flex: 1;">← Back</button>
          <button class="btn btn-primary" onclick="app.confirmBooking()" style="flex: 2;">Confirm & Pay $${b.price} →</button>
        </div>
      </div>
    `;
  },

  confirmBooking: function() {
    const b = this.currentBooking;
    const ref = 'SW' + Date.now().toString(36).toUpperCase().slice(-6);
    
    const newBooking = {
      ref: ref,
      date: new Date().toLocaleDateString(),
      from: b.from,
      to: b.to,
      depart: b.depart,
      arrive: b.arrive || 'TBD',
      flightNumber: b.flightNumber,
      passengers: 1,
      class: b.travelClass || 'Economy',
      price: b.price,
      status: 'Confirmed',
      passengerName: b.passengerName,
      passengerEmail: b.passengerEmail
    };
    
    const savedBookings = localStorage.getItem('skywings_bookings');
    const bookings = savedBookings ? JSON.parse(savedBookings) : [];
    bookings.unshift(newBooking);
    localStorage.setItem('skywings_bookings', JSON.stringify(bookings));
    
    alert(`Booking confirmed! Reference: ${ref}`);
    
    this.currentBooking = null;
    this.bookingStep = 1;
    
    window.location.href = 'bookings.html';
  },

  renderBookings: function() {
    const container = document.getElementById('bookings-list');
    if (!container) return;
    
    const savedBookings = localStorage.getItem('skywings_bookings');
    const bookings = savedBookings ? JSON.parse(savedBookings) : [];
    
    if (bookings.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✈️</div>
          <h3>No bookings yet</h3>
          <p>Start exploring destinations and book your first flight!</p>
          <button class="btn btn-primary" onclick="app.nav('book')" style="margin-top: 16px;">Book a Flight</button>
        </div>
      `;
      return;
    }
    
    container.innerHTML = bookings.map(b => `
      <div class="booking-card-item">
        <div class="booking-header">
          <div class="booking-ref">📋 ${this.escapeHtml(b.ref)}</div>
          <div class="booking-status ${b.status === 'Cancelled' ? 'cancelled' : 'confirmed'}">${b.status || 'Confirmed'}</div>
        </div>
        <div class="flight-details">
          <div class="flight-point"><strong>${this.escapeHtml(b.from)}</strong><br><small>Depart: ${this.escapeHtml(b.depart)}</small></div>
          <div class="flight-arrow">✈️ →</div>
          <div class="flight-point arrival"><strong>${this.escapeHtml(b.to)}</strong><br><small>Arrive: ${this.escapeHtml(b.arrive)}</small></div>
        </div>
        <div class="booking-meta">
          <span>📅 ${this.escapeHtml(b.date)}</span>
          <span>👤 ${this.escapeHtml(b.passengerName)}</span>
          <span>💺 ${this.escapeHtml(b.class)}</span>
          <span>💰 $${b.price}</span>
        </div>
        ${b.status !== 'Cancelled' ? `
          <div class="booking-actions">
            <button class="btn-sm" onclick="app.cancelBooking('${this.escapeHtml(b.ref)}')">❌ Cancel</button>
          </div>
        ` : '<p style="text-align: center; color: #dc2626; font-size: 13px; margin-top: 8px;">This booking has been cancelled</p>'}
      </div>
    `).join('');
  },

  cancelBooking: function(ref) {
    if (confirm(`Are you sure you want to cancel booking ${ref}?`)) {
      const savedBookings = localStorage.getItem('skywings_bookings');
      let bookings = savedBookings ? JSON.parse(savedBookings) : [];
      
      const bookingIndex = bookings.findIndex(b => b.ref === ref);
      if (bookingIndex !== -1) {
        bookings[bookingIndex].status = 'Cancelled';
        localStorage.setItem('skywings_bookings', JSON.stringify(bookings));
        alert(`Booking ${ref} has been cancelled`);
        this.renderBookings();
      }
    }
  },

  login: function() {
    const email = document.getElementById('loginEmail')?.value;
    if(!email) {
      alert('Please enter your email address.');
      return;
    }
    alert('Signed in successfully!');
    this.nav('home');
  },

  handleSignIn: function() {
    const name = document.getElementById('authName')?.value.trim();
    const email = document.getElementById('loginEmail')?.value.trim();
    const phone = document.getElementById('authPhone')?.value.trim();
    
    if (!name || !email || !phone) {
      alert('Please fill in all required fields (Name, Email, Phone)');
      return;
    }
    
    alert(`Welcome, ${name}! You have successfully signed in.`);
    this.nav('home');
  },

  goTo404: function() { this.nav('404'); },

  setupDates: function() {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split('T')[0];
    
    document.querySelectorAll('input[type="date"]').forEach(input => {
      if(!input.value) {
        if (input.id.includes('Return') || input.id.includes('return')) {
          input.value = nextMonthStr;
        } else {
          input.value = today;
        }
      }
    });
  },

  bindEvents: function() {
    const mobileBtn = document.getElementById('mobileMenuBtn');
    if (mobileBtn) {
      mobileBtn.addEventListener('click', () => {
        document.getElementById('mainNav')?.classList.toggle('open');
      });
    }
    
    const logo = document.querySelector('.logo');
    if (logo) {
      logo.addEventListener('click', (e) => {
        e.preventDefault();
        this.nav('home');
      });
    }
  },
  
  closeModal: function() {
    const modal = document.getElementById('bookingModal');
    if (modal) modal.classList.remove('show');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  app.init();
  
  const currentPath = window.location.pathname;
  
  if (currentPath.includes('book.html')) {
    app.displaySearchResults();
  }
  
  if (currentPath.includes('destinations.html') && app.data.length > 0) {
    setTimeout(() => {
      app.renderDestinations(app.data, 'dest-grid');
    }, 100);
  }
  
  if (currentPath.includes('bookings.html')) {
    app.renderBookings();
  }
});