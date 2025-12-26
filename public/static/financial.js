// ==========================================
// Financial Page Logic
// ==========================================

async function initFinancialPage() {
    initLogoutButton()

    const monthInput = document.getElementById('financialMonth')
    const refreshBtn = document.getElementById('refreshFinancial')
    const professionalSelect = document.getElementById('financialProfessional')
    const generatePdfBtn = document.getElementById('generatePdfBtn')
    const tableBody = document.getElementById('financialTableBody')
    const emptyState = document.getElementById('financialEmpty')
    const totalPaidEl = document.getElementById('totalPaid')
    const totalPendingEl = document.getElementById('totalPending')

    if (!monthInput || !tableBody) return

    // Store current appointments for PDF generation
    let currentAppointments = []
    let allProfessionals = []

    // Set default month to current
    const now = new Date()
    const currentMonth = now.toISOString().slice(0, 7) // YYYY-MM
    monthInput.value = currentMonth

    // Load professionals for dropdown
    async function loadProfessionals() {
        try {
            const res = await apiGet('/professionals', { auth: false })
            allProfessionals = res.professionals || []

            professionalSelect.innerHTML = '<option value="">Todos os Profissionais</option>'
            allProfessionals.forEach(prof => {
                const option = document.createElement('option')
                option.value = prof.id
                option.textContent = prof.name
                professionalSelect.appendChild(option)
            })
        } catch (error) {
            console.error('Error loading professionals', error)
        }
    }

    refreshBtn.addEventListener('click', () => loadFinancialData())
    monthInput.addEventListener('change', () => loadFinancialData())
    professionalSelect.addEventListener('change', () => loadFinancialData())

    // Expose toggle globally
    window.togglePaymentStatus = async (id, currentStatus) => {
        try {
            const newStatus = !currentStatus
            await apiPatch(`/appointments/${id}/payment`, { paid: newStatus }, { token: getPanelToken() })
            loadFinancialData() // Reload to update totals and UI
        } catch (error) {
            console.error('Error toggling payment', error)
            alert('Erro ao atualizar pagamento.')
        }
    }

    // Expose price update globally
    window.updateAppointmentPrice = async (input) => {
        const id = input.dataset.id
        const originalCents = parseInt(input.dataset.original, 10)
        const newValue = input.value.trim()

        // Parse the currency input
        const numericValue = newValue.replace(/[^\d,]/g, '').replace(',', '.')
        const newCents = Math.round(parseFloat(numericValue) * 100)

        // Validate
        if (isNaN(newCents) || newCents < 0) {
            alert('Valor inválido. Use o formato: R$ 100,00')
            input.value = formatCurrency(originalCents)
            return
        }

        // Check if changed
        if (newCents === originalCents) {
            return
        }

        try {
            await apiPatch(`/appointments/${id}/price`, { priceCents: newCents }, { token: getPanelToken() })
            input.dataset.original = newCents
            loadFinancialData() // Reload to update totals
        } catch (error) {
            console.error('Error updating price', error)
            alert('Erro ao atualizar valor.')
            input.value = formatCurrency(originalCents)
        }
    }

    async function loadFinancialData() {
        try {
            const monthVal = monthInput.value // YYYY-MM
            const selectedProfId = professionalSelect.value
            // Convert to date range
            const [year, month] = monthVal.split('-').map(Number)

            const res = await apiGet('/appointments', { token: getPanelToken() })
            const allAppointments = res.appointments || []

            // Filter by confirmed status AND month AND professional
            const filtered = allAppointments.filter(app => {
                if (app.status !== 'confirmed') return false

                // Filter by professional if selected
                if (selectedProfId && app.professionalId !== selectedProfId) return false

                const [aYear, aMonth] = app.date.split('-').map(Number)
                return aYear === year && aMonth === month
            })

            currentAppointments = filtered // Store for PDF generation
            renderFinancialTable(filtered)
            calculateTotals(filtered)

        } catch (error) {
            console.error('Error loading financial data', error)
            alert('Erro ao carregar dados.')
        }
    }

    function calculateTotals(appointments) {
        let paid = 0
        let pending = 0

        appointments.forEach(app => {
            const val = app.priceCents || 0
            if (app.paidAt) {
                paid += val
            } else {
                pending += val
            }
        })

        totalPaidEl.textContent = formatCurrency(paid)
        totalPendingEl.textContent = formatCurrency(pending)
    }

    function renderFinancialTable(appointments) {
        tableBody.innerHTML = ''
        if (appointments.length === 0) {
            emptyState.classList.remove('hidden')
            return
        }
        emptyState.classList.add('hidden')

        // Sort by date/time
        appointments.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date)
            return a.time.localeCompare(b.time)
        })

        tableBody.innerHTML = appointments.map(app => {
            const isPaid = !!app.paidAt
            const dateStr = formatDateString(app.date)

            return `
          <tr class="hover:bg-white/5 transition group">
            <td class="px-4 py-3 font-medium text-white">${dateStr} <span class="text-xs text-slate-400 ml-1 block">${app.time.slice(0, 5)}</span></td>
            <td class="px-4 py-3 text-slate-300">
              <div class="font-medium text-white">${escapeHtml(app.customerName)}</div>
              <div class="text-xs">${escapeHtml(app.customerPhone)}</div>
            </td>
            <td class="px-4 py-3 text-slate-300 text-sm">${escapeHtml(app.serviceName || 'Serviço não especificado')}</td>
            <td class="px-4 py-3">
              <input 
                type="text" 
                value="${formatCurrency(app.priceCents || 0)}"
                data-id="${app.id}"
                data-original="${app.priceCents || 0}"
                class="bg-transparent border-b border-white/20 text-white font-medium w-28 px-2 py-1 outline-none focus:border-pink-400 transition"
                onblur="updateAppointmentPrice(this)"
                onfocus="this.select()"
              />
            </td>
            <td class="px-4 py-3 text-center">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isPaid ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}">
                ${isPaid ? 'Pago' : 'Pendente'}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <button 
                onclick="togglePaymentStatus('${app.id}', ${isPaid})"
                class="text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${isPaid ? 'border-amber-500/30 text-amber-200 hover:bg-amber-500/10' : 'border-green-500/30 text-green-200 hover:bg-green-500/10'}"
              >
                ${isPaid ? 'Marcar como Pendente' : 'Marcar como Pago'}
              </button>
            </td>
          </tr>
        `
        }).join('')
    }

    // PDF Generation
    generatePdfBtn.addEventListener('click', () => {
        if (!window.jspdf) {
            alert('Biblioteca de PDF não carregada. Recarregue a página.')
            return
        }

        const { jsPDF } = window.jspdf
        const doc = new jsPDF()

        // Helper
        const formatBRL = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        const parseCurrency = (str) => parseFloat(str.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0

        // Load Logo
        const logoImg = new Image()
        logoImg.src = '/images/logo.png'

        logoImg.onload = () => {
            generatePDF(doc, logoImg)
        }

        logoImg.onerror = () => {
            // Fallback without logo
            generatePDF(doc, null)
        }

        function generatePDF(doc, img) {
            const pageWidth = doc.internal.pageSize.getWidth()

            // --- Header ---
            let startY = 20
            if (img) {
                // Calculate aspect ratio to fit width 90 (increased from 50)
                const imgWidth = 90
                const aspectRatio = img.height / img.width
                const imgHeight = imgWidth * aspectRatio

                const x = (pageWidth - imgWidth) / 2
                doc.addImage(img, 'PNG', x, 10, imgWidth, imgHeight)
                startY = 10 + imgHeight + 2 // Significantly reduced from +15 for tighter logo proximity
            }

            // Title
            doc.setFontSize(18) // Increased from 14
            doc.setTextColor(30, 41, 59) // Slate-800
            doc.text('Relatório Financeiro', pageWidth / 2, startY, { align: 'center' })

            // Setup metadata font
            startY += 8 // Increased spacing
            doc.setFontSize(10)
            doc.setTextColor(71, 85, 105) // Slate-600

            const selectedProfText = professionalSelect.selectedOptions?.[0]?.text || professionalSelect.options[professionalSelect.selectedIndex].text
            doc.text(`Profissional: ${selectedProfText}`, pageWidth / 2, startY, { align: 'center' })

            startY += 5 // Slightly tighter
            const [year, month] = monthInput.value.split('-')
            // Handle date parsing safely
            const dateObj = new Date(parseInt(year), parseInt(month) - 1, 2)
            const monthName = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
            doc.text(`Período: ${monthName}`, pageWidth / 2, startY, { align: 'center' })

            startY += 5 // Slightly tighter
            const now = new Date()
            const generatedStr = now.toLocaleString('pt-BR')
            doc.text(`Gerado em: ${generatedStr}`, pageWidth / 2, startY, { align: 'center' })

            // --- Summary Section ---
            startY += 20 // Increased from 15
            doc.setFontSize(12)
            doc.setTextColor(30, 30, 90) // Dark Blue
            doc.setFont(undefined, 'bold')
            doc.text('RESUMO DO PERÍODO', 14, startY)
            doc.setFont(undefined, 'normal')

            startY += 8
            doc.setFontSize(10)
            doc.setTextColor(30, 41, 59)

            // Values
            const totalPaidStr = totalPaidEl.textContent
            const totalPendingStr = totalPendingEl.textContent
            const totalPaidVal = parseCurrency(totalPaidStr)
            const totalPendingVal = parseCurrency(totalPendingStr)
            const totalGeral = totalPaidVal + totalPendingVal

            // Using approx 5mm for single spacing feel (font size 10 ~= 3.5mm)
            doc.text(`Total Recebido: ${totalPaidStr}`, 14, startY)
            startY += 5
            doc.text(`Pendente: ${totalPendingStr}`, 14, startY)
            startY += 5
            doc.text(`Total Geral: ${formatBRL(totalGeral)}`, 14, startY)
            startY += 5
            doc.text(`Quantidade de Atendimentos: ${currentAppointments.length}`, 14, startY)

            // --- Table ---
            const tableData = currentAppointments
                .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                .map(app => {
                    const dateStr = formatDateString(app.date) + ' ' + app.time.slice(0, 5)
                    const price = (app.priceCents || 0) / 100
                    const priceFormatted = price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

                    return [
                        dateStr,
                        app.customerName,
                        app.serviceName || '-',
                        priceFormatted,
                        app.paidAt ? 'Pago' : 'Pendente'
                    ]
                })

            doc.autoTable({
                startY: startY + 15, // Increased space before table
                head: [['Data/Hora', 'Cliente', 'Serviço', 'Valor', 'Status']],
                body: tableData,
                theme: 'striped',
                headStyles: {
                    fillColor: [30, 30, 60], // Dark Blue/Purple
                    textColor: 255,
                    fontStyle: 'bold',
                    halign: 'left'
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 4,
                    textColor: [50, 50, 50],
                    valign: 'middle'
                },
                columnStyles: {
                    0: { cellWidth: 35 },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 'auto' },
                    3: { cellWidth: 25, halign: 'right' },
                    4: { cellWidth: 25, halign: 'center' }
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 250]
                },
                // Footer
                didDrawPage: function (data) {
                    const pageSize = doc.internal.pageSize;
                    const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                    doc.setFontSize(8)
                    doc.setTextColor(150)
                    doc.text(
                        `Estúdio Aline Andrade - Relatório Financeiro - Página ${doc.internal.getNumberOfPages()}`,
                        data.settings.margin.left,
                        pageHeight - 10
                    )
                }
            })

            doc.save(`financeiro-${monthInput.value}.pdf`)
        }
    })

    loadProfessionals()
    loadFinancialData()
}

// Global expose
window.initFinancialPage = initFinancialPage
