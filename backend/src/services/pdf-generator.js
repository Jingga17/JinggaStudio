const puppeteer = require('puppeteer-core');

class PDFGenerator {
    constructor() {
        this.browser = null;
    }

    async init() {
        if (!this.browser) {
            console.log("Initializing Puppeteer...");
            this.browser = await puppeteer.launch({
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu'
                ],
                headless: 'new'
            });
            console.log("Puppeteer initialized.");
        }
    }

    /**
     * Generate a PDF for an individu or kelas report and return as a Buffer.
     * @param {string|number} id - Student ID (for individu) or class name (for kelas)
     * @param {'individu'|'kelas'} type - Report type
     * @returns {Promise<Buffer>} PDF buffer
     */
    async generatePDFBuffer(id, type = 'individu') {
        await this.init();
        const page = await this.browser.newPage();
        try {
            const encodedId = encodeURIComponent(id);
            const url = `http://frontend/report.html?type=${type}&id=${encodedId}`;
            console.log(`Navigating to ${url}...`);

            await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

            // Wait for the main content to be rendered
            await page.waitForSelector('.tbl-identitas, .kop-surat', { timeout: 15000 });

            // Give extra time for SVG and fonts to render
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Hide print controls
            await page.evaluate(() => {
                const printControls = document.getElementById('print-controls');
                if (printControls) printControls.style.display = 'none';
            });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
            });

            console.log(`PDF for ${type}/${id} generated successfully.`);
            return pdfBuffer;
        } catch (error) {
            console.error(`Error generating PDF for ${type}/${id}:`, error);
            throw error;
        } finally {
            await page.close();
        }
    }

    /**
     * Generate PDF for individu report and stream directly to Express response.
     * @param {object} data - Report data object (must contain data.student.id or data.id)
     * @param {object} res - Express response object
     */
    async generateIndividuPDF(data, res) {
        const studentId = data.student ? data.student.id : data.id;
        try {
            const pdfBuffer = await this.generatePDFBuffer(studentId, 'individu');
            res.end(pdfBuffer);
            console.log(`PDF for student ${studentId} generated and sent.`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            if (!res.headersSent) {
                res.status(500).end('Error generating PDF');
            }
        }
    }

    /**
     * Generate PDF for kelas report and stream directly to Express response.
     * @param {string} kelas - Class name
     * @param {object} res - Express response object
     */
    async generateKelasPDF(kelas, res) {
        try {
            const pdfBuffer = await this.generatePDFBuffer(kelas, 'kelas');
            res.end(pdfBuffer);
            console.log(`PDF for kelas ${kelas} generated and sent.`);
        } catch (error) {
            console.error('Error generating kelas PDF:', error);
            if (!res.headersSent) {
                res.status(500).end('Error generating PDF');
            }
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}

const generator = new PDFGenerator();
module.exports = {
    generateIndividuPDF: generator.generateIndividuPDF.bind(generator),
    generateKelasPDF: generator.generateKelasPDF.bind(generator),
    generatePDFBuffer: generator.generatePDFBuffer.bind(generator)
};
