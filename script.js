class FundGame {
    constructor() {
        // 基础游戏数据
        this.funds = [];
        this.currentDate = new Date('2020-12-30');
        this.gamePhase = 'tutorial';
        this.gameStartDate = new Date('2022-01-01');
        this.currentYear = 2020;
        
        // 用户相关数据
        this.selectedFund = null;
        this.userPortfolio = [];
        this.remainingChanges = 3;
        
        // UI相关
        this.autoPlayInterval = null;
        this.chart = null;
        this.indexChart = null;
        this.marketReviews = null;
        
        // 初始化
        this.bindEvents();
        this.initChart();
    }

    initializeGame() {
        this.loadFundData();
        this.loadMarketReviews();
        
        setTimeout(() => {
            this.updateMarketReview();
            
            const marketReviewText = document.getElementById('market-review-text');
            if (marketReviewText && (
                marketReviewText.innerText.includes('本周市场数据暂未更新') || 
                marketReviewText.innerText.includes('市场评价数据加载中')
            )) {
                for (let i = 1; i <= 3; i++) {
                    setTimeout(() => {
                        this.updateMarketReview();
                    }, i * 1000);
                }
            }
        }, 1500);
    }
    
    loadMarketReviews() {
        fetch('marketReviews.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('无法加载市场评价数据文件');
                }
                return response.json();
            })
            .then(data => {
                this.marketReviews = data;
                
                if (data.reviews) {
                    const dates = Object.keys(data.reviews);
                    
                    if (dates.length > 0) {
                        setTimeout(() => {
                            this.updateMarketReview();
                        }, 500);
                    }
                }
            })
            .catch(error => {
                console.error('加载市场评价数据失败:', error);
                this.marketReviews = {
                    reviews: {},
                    defaultReview: "本周市场数据暂未更新"
                };
            });
    }

    loadFundData() {
        this.toggleLoadingState(true);
        
        fetch('funddata.json')
            .then(response => {
                if (!response.ok) throw new Error('无法加载基金数据文件');
                return response.json();
            })
            .then(data => this.processFundData(data))
            .catch(error => this.handleDataLoadError(error));
    }
    
    processFundData(data) {
        this.funds = data.map((fund, index) => ({
            id: index,
            name: fund.name,
            data: fund.data.map(item => ({
                date: typeof item.date === 'string' ? new Date(item.date) : item.date,
                value: parseFloat(item.value),
                weeklyReturn: item.weeklyReturn || 0
            }))
        }));
        
        const loadingScreen = document.getElementById('loading-screen');
        const gameContainer = document.getElementById('game-container');
        
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (gameContainer) gameContainer.style.display = 'block';
        
        this.populateFundSelector();
        this.updateUI();
        this.updateChart();
    }
    
    handleDataLoadError(error) {
        this.toggleLoadingState(false);
        
        const errorElement = document.getElementById('load-error');
        if (errorElement) {
            errorElement.textContent = '加载基金数据失败: ' + error.message;
            errorElement.style.display = 'block';
            
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 3000);
        }
    }
    
    toggleLoadingState(isLoading) {
        const loadingIndicator = document.getElementById('loading-indicator');
        const loadDataBtn = document.getElementById('load-data-btn');
        
        if (loadingIndicator) loadingIndicator.style.display = isLoading ? 'flex' : 'none';
        if (loadDataBtn) loadDataBtn.style.display = isLoading ? 'none' : 'block';
    }

    populateFundSelector() {
        const selector = document.getElementById('fund-selector');
        if (!selector) return;
        
        selector.innerHTML = '<option value="">请选择基金产品</option>';
        
        this.funds.forEach((fund, index) => {
            const option = document.createElement('option');
            option.value = fund.id;
            option.textContent = fund.name;
            selector.appendChild(option);
        });
    }

    bindEvents() {
        console.log('Binding events...');
        
        const fundSelector = document.getElementById('fund-selector');
        if (fundSelector) {
            fundSelector.addEventListener('change', (e) => {
                const confirmBtn = document.getElementById('confirm-selection');
                if (confirmBtn) confirmBtn.disabled = !e.target.value;
            });
        }

        const confirmBtn = document.getElementById('confirm-selection');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.selectFund();
            });
        }

        const changeFundBtn = document.getElementById('change-fund');
        if (changeFundBtn) {
            changeFundBtn.addEventListener('click', () => {
                this.showFundSelector();
            });
        }

        const nextWeekBtn = document.getElementById('next-week');
        console.log('Next week button found:', !!nextWeekBtn);
        if (nextWeekBtn) {
            nextWeekBtn.addEventListener('click', () => {
                console.log('Next week button clicked!');
                this.nextWeek();
            });
        }

        const autoPlayBtn = document.getElementById('auto-play');
        if (autoPlayBtn) {
            autoPlayBtn.addEventListener('click', () => {
                this.startAutoPlay();
            });
        }

        const pauseAutoBtn = document.getElementById('pause-auto');
        if (pauseAutoBtn) {
            pauseAutoBtn.addEventListener('click', () => {
                this.stopAutoPlay();
            });
        }

        const closeSummaryBtn = document.getElementById('close-summary');
        if (closeSummaryBtn) {
            closeSummaryBtn.addEventListener('click', () => {
                const modal = document.getElementById('year-summary-modal');
                if (modal) modal.style.display = 'none';
            });
        }
        
        const closeWeeklyBtn = document.getElementById('close-weekly-review');
        console.log('Close weekly review button found:', !!closeWeeklyBtn);
        if (closeWeeklyBtn) {
            closeWeeklyBtn.addEventListener('click', () => {
                const modal = document.getElementById('weekly-review-modal');
                if (modal) modal.style.display = 'none';
            });
        }
        
        console.log('Events bound successfully');
    }

    selectFund() {
        const selector = document.getElementById('fund-selector');
        if (!selector) return;
        
        const fundId = parseInt(selector.value);
        
        if (fundId >= 0 && this.funds[fundId]) {
            this.selectedFund = fundId;
            this.userPortfolio.push({
                date: new Date(this.currentDate),
                fundId: fundId,
                fundName: this.funds[fundId].name
            });
            
            selector.style.display = 'none';
            
            const confirmBtn = document.getElementById('confirm-selection');
            const changeFundBtn = document.getElementById('change-fund');
            
            if (confirmBtn) confirmBtn.style.display = 'none';
            if (changeFundBtn) changeFundBtn.style.display = 'inline-block';
            
            this.updateChart();
            this.updateUI();
        }
    }

    showFundSelector() {
        if (this.remainingChanges > 0 || this.gamePhase === 'tutorial') {
            const selector = document.getElementById('fund-selector');
            const confirmBtn = document.getElementById('confirm-selection');
            const changeFundBtn = document.getElementById('change-fund');
            
            if (selector) selector.style.display = 'block';
            if (confirmBtn) confirmBtn.style.display = 'inline-block';
            if (changeFundBtn) changeFundBtn.style.display = 'none';
            
            if (this.gamePhase !== 'tutorial') {
                this.remainingChanges--;
            }
        } else {
            alert('本年度调整机会已用完！');
        }
    }

    nextWeek() {
        const isManualClick = !this.autoPlayInterval;
        console.log('nextWeek called, isManualClick:', isManualClick);
        
        if (!this.funds || this.funds.length === 0) {
            console.log('Fund data not loaded yet, cannot proceed');
            return;
        }
        
        this.currentDate.setDate(this.currentDate.getDate() + 7);
        console.log('Current date updated to:', this.currentDate);
        
        if (this.isEndOfData()) {
            this.stopAutoPlay();
            this.showFinalSummary();
            return;
        }
        
        this.updateGameInterface();
        
        if (isManualClick) {
            console.log('Manual click detected, showing weekly review...');
            this.showWeeklyReview();
        }
        
        this.checkSpecialDateEvents();
    }
    
    isEndOfData() {
        if (!this.funds || this.funds.length === 0) return true;
        
        const currentDataIndex = this.getCurrentDataIndex();
        return currentDataIndex >= this.funds[0].data.length - 1;
    }
    
    updateGameInterface() {
        this.updateChart();
        this.updateUI();
        this.updateRanking();
    }
    
    checkSpecialDateEvents() {
        if (this.currentDate.getMonth() === 11 && this.currentDate.getDate() >= 25) {
            this.showYearSummary();
        }
        
        if (this.currentDate.getFullYear() > this.currentYear) {
            this.handleNewYear();
        }
    }
    
    handleNewYear() {
        this.currentYear = this.currentDate.getFullYear();
        
        if (this.currentYear === 2021) {
            // 从2020年进入2021年，仍然是教学阶段
            console.log('进入2021年，继续教学阶段');
        } else if (this.currentYear === 2022) {
            this.gamePhase = 'playing';
            this.resetGameFor2022();
            alert('新手教学结束！现在开始正式游戏，每年有3次调整机会。所有产品净值已归一化重新开始。');
        }
        
        this.remainingChanges = 3;
        this.showFundSelector();
    }

    showWeeklyReview() {
        console.log('showWeeklyReview called');
        
        const modal = document.getElementById('weekly-review-modal');
        console.log('Modal element found:', !!modal);
        
        if (!modal) {
            console.error('找不到weekly-review-modal元素');
            alert('市场简评模态框未找到，请检查HTML结构');
            return;
        }
        
        try {
            console.log('Updating weekly product review');
            this.updateWeeklyProductReview();
            
            console.log('Updating index chart');
            this.updateIndexChart();
            
            console.log('Updating market review');
            this.updateMarketReview();
            
            console.log('Showing modal');
            modal.style.display = 'flex';
            console.log('Modal display style set to flex');
            
        } catch (error) {
            console.error('Error in showWeeklyReview:', error);
            alert('显示市场简评时出错: ' + error.message);
        }
    }
    
    updateWeeklyProductReview() {
        const currentIndex = this.getCurrentDataIndex();
        if (currentIndex <= 0) return;
        
        const weeklyReturns = this.funds.map((fund, index) => {
            const currentValue = fund.data[currentIndex].value;
            const prevValue = fund.data[currentIndex - 1].value;
            const weeklyReturn = (currentValue - prevValue) / prevValue * 100;
            
            return {
                id: index,
                name: fund.name,
                return: weeklyReturn
            };
        });
        
        weeklyReturns.sort((a, b) => b.return - a.return);
        
        const topPerformers = document.getElementById('top-performers-list');
        if (topPerformers) {
            topPerformers.innerHTML = '';
            weeklyReturns.slice(0, 3).forEach(fund => {
                const div = document.createElement('div');
                div.className = 'performer-item';
                div.innerHTML = `
                    <span class="fund-name">${fund.name}</span>
                    <span class="return-value positive">${fund.return.toFixed(2)}%</span>
                `;
                topPerformers.appendChild(div);
            });
        }
        
        const bottomPerformers = document.getElementById('bottom-performers-list');
        if (bottomPerformers) {
            bottomPerformers.innerHTML = '';
            weeklyReturns.slice(-3).reverse().forEach(fund => {
                const div = document.createElement('div');
                div.className = 'performer-item';
                div.innerHTML = `
                    <span class="fund-name">${fund.name}</span>
                    <span class="return-value negative">${fund.return.toFixed(2)}%</span>
                `;
                bottomPerformers.appendChild(div);
            });
        }
        
        const returns = weeklyReturns.map(f => f.return);
        const medianReturn = this.calculateMedian(returns);
        const minReturn = Math.min(...returns);
        const maxReturn = Math.max(...returns);
        
        const medianElement = document.getElementById('median-return');
        if (medianElement) {
            medianElement.textContent = medianReturn.toFixed(2) + '%';
            medianElement.className = 'stat-value ' + (medianReturn >= 0 ? 'positive' : 'negative');
        }
        
        const rangeElement = document.getElementById('return-range');
        if (rangeElement) {
            rangeElement.textContent = `${minReturn.toFixed(2)}% ~ ${maxReturn.toFixed(2)}%`;
        }
    }
    
    calculateMedian(arr) {
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    
    updateIndexChart() {
        const canvas = document.getElementById('index-chart');
        if (!canvas) return;
        
        // 生成模拟的宽基指数涨跌幅数据
        const indexData = this.generateIndexPerformanceData();
        
        if (this.indexChart) {
            this.indexChart.destroy();
        }
        
        this.indexChart = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['沪深300', '中证500', '中证1000', '中证2000'],
                datasets: [{
                    label: '本周涨跌幅(%)',
                    data: indexData,
                    backgroundColor: indexData.map(value => value >= 0 ? '#e74c3c' : '#27ae60'),
                    borderColor: indexData.map(value => value >= 0 ? '#c0392b' : '#229954'),
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => value.toFixed(1) + '%'
                        },
                        title: {
                            display: true,
                            text: '涨跌幅(%)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: '指数类别'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y.toFixed(2) + '%';
                            }
                        }
                    }
                }
            }
        });
    }
    
    generateIndexPerformanceData() {
        // 基于当前日期生成模拟的指数表现数据
        const currentIndex = this.getCurrentDataIndex();
        if (currentIndex <= 0) return [0, 0, 0, 0];
        
        // 使用基金数据计算大致的市场表现
        const avgReturn = this.funds.reduce((sum, fund) => {
            if (currentIndex < fund.data.length && currentIndex > 0) {
                const current = fund.data[currentIndex].value;
                const prev = fund.data[currentIndex - 1].value;
                return sum + ((current - prev) / prev * 100);
            }
            return sum;
        }, 0) / this.funds.length;
        
        // 生成相关但有差异的指数表现
        const baseReturn = avgReturn;
        return [
            baseReturn + (Math.random() - 0.5) * 2,  // 沪深300
            baseReturn + (Math.random() - 0.5) * 3,  // 中证500
            baseReturn + (Math.random() - 0.5) * 4,  // 中证1000
            baseReturn + (Math.random() - 0.5) * 5   // 中证2000
        ];
    }

    findClosestDate(targetDate) {
        if (!this.marketReviews || !this.marketReviews.reviews) {
            console.log('Market reviews not loaded or empty');
            return null;
        }
        
        const dates = Object.keys(this.marketReviews.reviews);
        if (dates.length === 0) {
            console.log('No review dates available');
            return null;
        }
        
        const targetTime = new Date(targetDate).getTime();
        console.log('Looking for date:', targetDate.toISOString().split('T')[0]);
        console.log('Available dates:', dates);
        
        let closestDate = null;
        let minDiff = Infinity;
        
        for (const dateStr of dates) {
            const date = new Date(dateStr);
            const diff = Math.abs(date.getTime() - targetTime);
            
            if (diff < minDiff) {
                minDiff = diff;
                closestDate = dateStr;
            }
        }
        
        // 扩大时间匹配范围到30天，确保能找到合适的评价
        if (minDiff > 30 * 24 * 60 * 60 * 1000) {
            console.log('No close date found, using first available date');
            closestDate = dates[0]; // 使用第一个可用日期
        }
        
        console.log('Selected date:', closestDate);
        return closestDate;
    }

    updateMarketReview() {
        try {
            const closestDate = this.findClosestDate(this.currentDate);
            const reviewContent = this.getMarketReviewContent(closestDate);
            this.updateWeeklyReviewModules(reviewContent);
        } catch (error) {
            console.error('更新市场评价时出错:', error);
            
            const marketReviewText = document.getElementById('market-review-text');
            if (marketReviewText) {
                marketReviewText.innerHTML = '<p class="error">加载市场评价数据失败，请稍后再试。</p>';
            }
        }
    }
    
    getMarketReviewContent(closestDate) {
        console.log('Getting market review content for date:', closestDate);
        
        if (!closestDate || !this.marketReviews || !this.marketReviews.reviews[closestDate]) {
            console.log('No review found, using default');
            return {
                date: this.currentDate.toLocaleDateString('zh-CN'),
                reviewContent: this.marketReviews?.defaultReview || '本周市场数据暂未更新'
            };
        }
        
        // marketReviews.json中的数据是直接的字符串内容
        const reviewContent = this.marketReviews.reviews[closestDate];
        console.log('Found review content:', reviewContent);
        
        return {
            date: new Date(closestDate).toLocaleDateString('zh-CN'),
            reviewContent: reviewContent
        };
    }
    
    updateWeeklyReviewModules(content) {
        console.log('Updating weekly review modules with content:', content);
        
        const reviewDate = document.getElementById('review-date');
        if (reviewDate) reviewDate.textContent = content.date;
        
        // 更新A股市场回顾内容
        const marketReviewText = document.getElementById('market-review-text');
        if (marketReviewText) {
            const reviewContent = content.reviewContent || '本周市场数据暂未更新';
            console.log('Setting market review text to:', reviewContent);
            marketReviewText.innerHTML = `<p>${reviewContent}</p>`;
        } else {
            console.error('market-review-text element not found');
        }
    }

    initChart() {
        const ctx = document.getElementById('performance-chart');
        if (!ctx) {
            console.error('图表画布未找到');
            return;
        }
        
        // 销毁现有图表
        if (this.chart) {
            this.chart.destroy();
        }
        
        this.chart = new Chart(ctx.getContext('2d'), this.getChartConfig());
        
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    getChartConfig() {
        const deviceInfo = {
            isMobile: window.innerWidth <= 768,
            isSmallMobile: window.innerWidth <= 480
        };
        
        return {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 0 },
                scales: this.getChartScales(deviceInfo),
                plugins: this.getChartPlugins(deviceInfo),
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        };
    }
    
    getChartScales(deviceInfo) {
        const { isMobile, isSmallMobile } = deviceInfo;
        
        return {
            y: {
                beginAtZero: false,
                title: {
                    display: !isSmallMobile,
                    text: '净值'
                },
                ticks: {
                    callback: value => value.toFixed(3),
                    font: { size: isMobile ? 10 : 12 }
                }
            },
            x: {
                title: {
                    display: !isSmallMobile,
                    text: '日期'
                },
                ticks: {
                    maxRotation: 90,
                    minRotation: isMobile ? 45 : 0,
                    font: { size: isMobile ? 8 : 12 },
                    callback: function(value, index, values) {
                        if (isMobile) {
                            const skipFactor = isSmallMobile ? 8 : 4;
                            return index % skipFactor === 0 ? this.getLabelForValue(value) : '';
                        }
                        return this.getLabelForValue(value);
                    }
                }
            }
        };
    }
    
    getChartPlugins(deviceInfo) {
        const { isMobile } = deviceInfo;
        
        return {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    boxWidth: isMobile ? 6 : 10,
                    font: { size: isMobile ? 10 : 12 }
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                bodyFont: { size: isMobile ? 10 : 14 },
                titleFont: { size: isMobile ? 12 : 16 }
            }
        };
    }
    
    handleResize() {
        if (this.chart) {
            this.chart.destroy();
            this.initChart();
            this.updateChart();
        }
    }

    updateChart() {
        if (!this.chart || !this.funds || this.funds.length === 0) return;
        
        const currentDataIndex = this.getCurrentDataIndex();
        const startIndex = this.getChartStartIndex();
        
        console.log('Chart update - Current date:', this.currentDate.toLocaleDateString('zh-CN'));
        console.log('Chart update - Current data index:', currentDataIndex);
        console.log('Chart update - Start index:', startIndex);
        
        const chartData = this.getChartData(startIndex, currentDataIndex);
        this.chart.data = chartData;
        
        this.updateChartYAxisRange(chartData.allValues);
        this.chart.update();
    }
    
    getChartStartIndex() {
        if (this.gamePhase !== 'playing' || !this.funds || this.funds.length === 0) return 0;
        
        const startIndex = this.funds[0].data.findIndex(item => 
            item.date.getFullYear() === 2022 && item.date.getMonth() === 0
        );
        
        return startIndex === -1 ? 0 : startIndex;
    }
    
    getChartData(startIndex, currentDataIndex) {
        const colors = this.generateColors(this.funds.length + 1);
        const pointStyles = this.generatePointStyles(this.funds.length + 1);
        
        const datasets = [];
        let allValues = [];
        
        console.log('getChartData - startIndex:', startIndex, 'currentDataIndex:', currentDataIndex);
        
        this.funds.forEach((fund, index) => {
            // 确保只显示到当前日期的数据
            const data = fund.data.slice(startIndex, currentDataIndex + 1).map(item => item.value);
            allValues.push(...data);
            
            datasets.push(this.createFundDataset(fund.name, data, colors[index], pointStyles[index]));
        });
        
        if (this.selectedFund !== null) {
            const userDataset = this.createUserPortfolioDataset(startIndex, currentDataIndex);
            const validUserData = userDataset.data.filter(val => val !== null && val !== undefined);
            if (validUserData.length > 0) {
                allValues.push(...validUserData);
            }
            datasets.push(userDataset);
        }
        
        // 确保标签也只显示到当前日期
        const labels = this.funds.length > 0 
            ? this.funds[0].data.slice(startIndex, currentDataIndex + 1).map(item => 
                item.date.toLocaleDateString('zh-CN')
              )
            : [];
        
        console.log('getChartData - labels:', labels);
        
        return { labels, datasets, allValues };
    }
    
    createFundDataset(name, data, color, pointStyle) {
        const pointColor = this.generatePointColor(color);
        
        return {
            label: name,
            data: data,
            borderColor: color,
            backgroundColor: color + '20',
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: pointColor,
            pointBorderColor: color,
            pointBorderWidth: 2,
            pointStyle: pointStyle
        };
    }
    
    createUserPortfolioDataset(startIndex, currentDataIndex) {
        const userPortfolioData = this.calculateUserPortfolioValue();
        // 确保用户投资组合数据也只显示到当前日期
        const displayData = userPortfolioData.slice(startIndex, currentDataIndex + 1);
        
        return {
            label: '您的投资组合',
            data: displayData,
            borderColor: '#e74c3c',
            backgroundColor: '#e74c3c20',
            borderWidth: 6,
            pointRadius: 6,
            pointHoverRadius: 9,
            pointBackgroundColor: '#ff8b8b',
            pointBorderColor: '#e74c3c',
            pointBorderWidth: 2,
            pointStyle: 'circle',
            fill: false,
            tension: 0.1,
            order: 0
        };
    }
    
    updateChartYAxisRange(values) {
        if (!this.chart || !values || values.length === 0) return;
        
        const min = Math.min(...values);
        const max = Math.max(...values);
        const padding = (max - min) * 0.1;
        
        this.chart.options.scales.y.min = Math.max(0, min - padding);
        this.chart.options.scales.y.max = max + padding;
    }

    generateColors(count) {
        const baseColors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
        ];
        
        const colors = [];
        for (let i = 0; i < count; i++) {
            if (i < baseColors.length) {
                colors.push(baseColors[i]);
            } else {
                const hue = (i * 137.5) % 360;
                colors.push('hsl(' + hue + ', 65%, 55%)');
            }
        }
        return colors;
    }

    generatePointStyles(count) {
        const styles = ['circle', 'triangle', 'rect', 'rectRounded', 'rectRot', 'cross', 'crossRot', 'star', 'line', 'dash'];
        const pointStyles = [];
        
        for (let i = 0; i < count; i++) {
            pointStyles.push(styles[i % styles.length]);
        }
        return pointStyles;
    }

    generatePointColor(lineColor) {
        if (lineColor.startsWith('#')) {
            const r = parseInt(lineColor.slice(1, 3), 16);
            const g = parseInt(lineColor.slice(3, 5), 16);
            const b = parseInt(lineColor.slice(5, 7), 16);
            
            const newR = Math.min(255, r + 60);
            const newG = Math.min(255, g + 60);
            const newB = Math.min(255, b + 60);
            
            return 'rgb(' + newR + ', ' + newG + ', ' + newB + ')';
        }
        return lineColor;
    }

    getCurrentDataIndex() {
        if (!this.funds || this.funds.length === 0) return 0;
        
        const currentFund = this.funds[0];
        const currentTime = this.currentDate.getTime();
        
        // 找到小于等于当前日期的最后一个数据点
        let lastValidIndex = 0;
        for (let i = 0; i < currentFund.data.length; i++) {
            const dataDate = currentFund.data[i].date;
            if (dataDate.getTime() <= currentTime) {
                lastValidIndex = i;
            } else {
                break;
            }
        }
        
        console.log('getCurrentDataIndex - Current date:', this.currentDate.toLocaleDateString('zh-CN'));
        console.log('getCurrentDataIndex - Found index:', lastValidIndex);
        if (currentFund.data[lastValidIndex]) {
            console.log('getCurrentDataIndex - Data date at index:', currentFund.data[lastValidIndex].date.toLocaleDateString('zh-CN'));
        }
        
        return lastValidIndex;
    }

    calculateUserPortfolioValue() {
        if (!this.funds || this.funds.length === 0 || this.userPortfolio.length === 0) {
            return [];
        }
        
        const result = Array(this.funds[0].data.length).fill(null);
        
        for (let i = 0; i < this.userPortfolio.length; i++) {
            const change = this.userPortfolio[i];
            const fundId = change.fundId;
            const changeDate = change.date;
            
            let startIndex = 0;
            for (let j = 0; j < this.funds[0].data.length; j++) {
                const dataDate = this.funds[0].data[j].date;
                if (dataDate.getTime() >= changeDate.getTime()) {
                    startIndex = j;
                    break;
                }
            }
            
            const endIndex = i < this.userPortfolio.length - 1 
                ? this.findDateIndex(this.userPortfolio[i + 1].date)
                : this.getCurrentDataIndex();
            
            for (let j = startIndex; j <= endIndex; j++) {
                result[j] = this.funds[fundId].data[j].value;
            }
        }
        
        return result;
    }
    
    findDateIndex(date) {
        if (!this.funds || this.funds.length === 0) return 0;
        
        for (let i = 0; i < this.funds[0].data.length; i++) {
            const dataDate = this.funds[0].data[i].date;
            if (dataDate.getTime() >= date.getTime()) {
                return i;
            }
        }
        
        return this.funds[0].data.length - 1;
    }

    updateUI() {
        const currentDateElement = document.getElementById('current-date');
        if (currentDateElement) {
            currentDateElement.textContent = this.currentDate.toLocaleDateString('zh-CN');
        }
        
        const gamePhaseElement = document.getElementById('game-phase');
        if (gamePhaseElement) {
            gamePhaseElement.textContent = this.gamePhase === 'tutorial' ? '新手教学' : '正式游戏';
        }
        
        const remainingChangesElement = document.getElementById('remaining-changes');
        if (remainingChangesElement) {
            if (this.gamePhase === 'playing') {
                remainingChangesElement.textContent = `调整机会: ${this.remainingChanges}次`;
                remainingChangesElement.style.display = 'inline';
            } else {
                remainingChangesElement.style.display = 'none';
            }
        }
        
        this.updateUserStats();
    }
    
    updateUserStats() {
        const stats = this.calculateUserStats();
        
        const totalReturnElement = document.getElementById('total-return');
        if (totalReturnElement) {
            totalReturnElement.textContent = stats.totalReturn.toFixed(2) + '%';
            totalReturnElement.className = stats.totalReturn >= 0 ? 'positive' : 'negative';
        }
        
        const weeklyReturnElement = document.getElementById('weekly-return');
        if (weeklyReturnElement) {
            weeklyReturnElement.textContent = stats.weeklyReturn.toFixed(2) + '%';
            weeklyReturnElement.className = stats.weeklyReturn >= 0 ? 'positive' : 'negative';
        }
        
        const volatilityElement = document.getElementById('volatility');
        if (volatilityElement) {
            volatilityElement.textContent = stats.volatility.toFixed(2) + '%';
        }
        
        const maxDrawdownElement = document.getElementById('max-drawdown');
        if (maxDrawdownElement) {
            maxDrawdownElement.textContent = stats.maxDrawdown.toFixed(2) + '%';
        }
        
        const sharpeRatioElement = document.getElementById('sharpe-ratio');
        if (sharpeRatioElement) {
            sharpeRatioElement.textContent = stats.sharpeRatio.toFixed(2);
        }
    }
    
    calculateUserStats() {
        const defaultStats = {
            totalReturn: 0,
            weeklyReturn: 0,
            volatility: 0,
            maxDrawdown: 0,
            sharpeRatio: 0
        };
        
        if (this.selectedFund === null || !this.funds || this.funds.length === 0) {
            return defaultStats;
        }
        
        try {
            const fund = this.funds[this.selectedFund];
            const currentIndex = this.getCurrentDataIndex();
            
            const startValue = fund.data[0].value;
            const currentValue = fund.data[currentIndex].value;
            const totalReturn = (currentValue - startValue) / startValue * 100;
            
            const weeklyReturn = currentIndex > 0 
                ? (currentValue - fund.data[currentIndex - 1].value) / fund.data[currentIndex - 1].value * 100
                : 0;
            
            const returns = [];
            for (let i = 1; i <= currentIndex; i++) {
                returns.push((fund.data[i].value - fund.data[i - 1].value) / fund.data[i - 1].value);
            }
            
            const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
            const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
            const volatility = Math.sqrt(variance * 52) * 100;
            
            let maxDrawdown = 0;
            let peak = fund.data[0].value;
            
            for (let i = 1; i <= currentIndex; i++) {
                if (fund.data[i].value > peak) {
                    peak = fund.data[i].value;
                } else {
                    const drawdown = (peak - fund.data[i].value) / peak * 100;
                    maxDrawdown = Math.max(maxDrawdown, drawdown);
                }
            }
            
            const annualizedReturn = Math.pow(1 + avgReturn, 52) - 1;
            const sharpeRatio = volatility > 0 ? (annualizedReturn - 0.03) / (volatility / 100) : 0;
            
            return {
                totalReturn,
                weeklyReturn,
                volatility,
                maxDrawdown,
                sharpeRatio
            };
        } catch (error) {
            console.error('计算用户统计数据时出错:', error);
            return defaultStats;
        }
    }

    updateRanking() {
        const rankingTable = document.getElementById('ranking-table');
        if (!rankingTable || !this.funds || this.funds.length === 0) return;
        
        const tbody = rankingTable.querySelector('tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const currentIndex = this.getCurrentDataIndex();
        if (currentIndex <= 0) return;
        
        const fundStats = this.funds.map((fund, index) => {
            const currentValue = fund.data[currentIndex].value;
            const prevValue = fund.data[currentIndex - 1].value;
            const weeklyReturn = (currentValue - prevValue) / prevValue * 100;
            
            const startValue = fund.data[0].value;
            const totalReturn = (currentValue - startValue) / startValue * 100;
            
            // 计算夏普比率和最大回撤
            const returns = [];
            for (let i = 1; i <= currentIndex; i++) {
                returns.push((fund.data[i].value - fund.data[i - 1].value) / fund.data[i - 1].value);
            }
            
            const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
            const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
            const volatility = Math.sqrt(variance * 52);
            const annualizedReturn = Math.pow(1 + avgReturn, 52) - 1;
            const sharpeRatio = volatility > 0 ? (annualizedReturn - 0.03) / volatility : 0;
            
            let maxDrawdown = 0;
            let peak = fund.data[0].value;
            for (let i = 1; i <= currentIndex; i++) {
                if (fund.data[i].value > peak) {
                    peak = fund.data[i].value;
                } else {
                    const drawdown = (peak - fund.data[i].value) / peak * 100;
                    maxDrawdown = Math.max(maxDrawdown, drawdown);
                }
            }
            
            return {
                id: index,
                name: fund.name,
                weeklyReturn: weeklyReturn,
                totalReturn: totalReturn,
                sharpeRatio: sharpeRatio,
                maxDrawdown: maxDrawdown
            };
        });
        
        fundStats.sort((a, b) => b.totalReturn - a.totalReturn);
        
        fundStats.forEach((item, rank) => {
            const row = document.createElement('tr');
            row.className = item.id === this.selectedFund ? 'selected-fund' : '';
            
            row.innerHTML = `
                <td>${rank + 1}</td>
                <td>${item.name}</td>
                <td class="${item.weeklyReturn >= 0 ? 'positive' : 'negative'}">${item.weeklyReturn.toFixed(2)}%</td>
                <td class="${item.totalReturn >= 0 ? 'positive' : 'negative'}">${item.totalReturn.toFixed(2)}%</td>
                <td>${item.sharpeRatio.toFixed(2)}</td>
                <td class="negative">${item.maxDrawdown.toFixed(2)}%</td>
            `;
            
            tbody.appendChild(row);
        });
    }

    showYearSummary() {
        this.stopAutoPlay();
        
        const year = this.currentDate.getFullYear();
        const userStats = this.calculateUserStats();
        
        const yearStartIndex = this.funds[0].data.findIndex(item => 
            item.date.getFullYear() === year && item.date.getMonth() === 0
        );
        
        const currentIndex = this.getCurrentDataIndex();
        const yearlyReturns = this.funds.map((fund, index) => {
            const startValue = yearStartIndex >= 0 ? fund.data[yearStartIndex].value : fund.data[0].value;
            const currentValue = fund.data[currentIndex].value;
            const yearReturn = (currentValue - startValue) / startValue * 100;
            
            return {
                id: index,
                name: fund.name,
                return: yearReturn
            };
        });
        
        yearlyReturns.sort((a, b) => b.return - a.return);
        
        let html = `
            <h4>${year}年度投资总结</h4>
            <div class="year-stats">
                <p><strong>您的年度表现：</strong></p>
                <p>年度收益率: <span class="${userStats.totalReturn >= 0 ? 'positive' : 'negative'}">
                    ${userStats.totalReturn.toFixed(2)}%</span></p>
                <p>夏普比率: ${userStats.sharpeRatio.toFixed(2)}</p>
                <p>最大回撤: <span class="negative">${userStats.maxDrawdown.toFixed(2)}%</span></p>
                <p>波动率: ${userStats.volatility.toFixed(2)}%</p>
                
                <h5>基金年度排行榜:</h5>
                <table class="summary-table">
                    <tr>
                        <th>排名</th>
                        <th>产品名称</th>
                        <th>年度收益</th>
                    </tr>
        `;
        
        yearlyReturns.forEach((item, index) => {
            const isSelected = item.id === this.selectedFund;
            html += `
                <tr class="${isSelected ? 'selected-fund' : ''}">
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    <td class="${item.return >= 0 ? 'positive' : 'negative'}">${item.return.toFixed(2)}%</td>
                </tr>
            `;
        });
        
        html += `
                </table>
                <p style="margin-top: 20px;">新的一年即将开始，您将有3次调整投资组合的机会。</p>
            </div>
        `;
        
        const summaryContent = document.getElementById('year-summary-content');
        if (summaryContent) {
            summaryContent.innerHTML = html;
        }
        
        const modal = document.getElementById('year-summary-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
        
        const closeBtn = document.getElementById('close-summary');
        if (closeBtn) {
            closeBtn.textContent = '继续';
        }
    }

    showFinalSummary() {
        const summaryData = this.prepareSummaryData();
        const summaryHTML = this.generateSummaryHTML(summaryData);
        
        const summaryContent = document.getElementById('year-summary-content');
        if (summaryContent) {
            summaryContent.innerHTML = summaryHTML;
        }
        
        const modal = document.getElementById('year-summary-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
        
        const closeBtn = document.getElementById('close-summary');
        if (closeBtn) {
            closeBtn.textContent = '完成挑战';
        }
    }
    
    prepareSummaryData() {
        const userStats = this.calculateUserStats();
        const fundPerformance = this.calculateFundPerformance();
        const userRank = this.calculateUserRank(userStats, fundPerformance);
        const isMobile = window.innerWidth <= 768;
        
        return {
            userStats,
            fundPerformance,
            userRank,
            isMobile,
            totalParticipants: fundPerformance.length + 1
        };
    }
    
    calculateFundPerformance() {
        return this.funds.map(fund => {
            const startValue = fund.data[0].value;
            const endValue = fund.data[fund.data.length - 1].value;
            const totalReturn = (endValue - startValue) / startValue * 100;
            
            const weeklyReturns = this.calculateWeeklyReturnsForFund(fund);
            const { sharpeRatio, maxDrawdown } = this.calculateRiskMetricsForFund(fund.data, weeklyReturns);
            
            return {
                name: fund.name,
                return: totalReturn,
                sharpeRatio: sharpeRatio,
                maxDrawdown: maxDrawdown * 100
            };
        }).sort((a, b) => b.return - a.return);
    }
    
    calculateWeeklyReturnsForFund(fund) {
        const returns = [];
        for (let i = 1; i < fund.data.length; i++) {
            returns.push((fund.data[i].value - fund.data[i - 1].value) / fund.data[i - 1].value);
        }
        return returns;
    }
    
    calculateRiskMetricsForFund(data, weeklyReturns) {
        const avgReturn = weeklyReturns.reduce((sum, r) => sum + r, 0) / weeklyReturns.length;
        const variance = weeklyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / weeklyReturns.length;
        const volatility = Math.sqrt(variance * 52);
        const annualizedReturn = Math.pow(1 + avgReturn, 52) - 1;
        const sharpeRatio = (annualizedReturn - 0.03) / volatility;
        
        let maxDrawdown = 0;
        let peak = data[0].value;
        
        for (let i = 1; i < data.length; i++) {
            if (data[i].value > peak) {
                peak = data[i].value;
            } else {
                const drawdown = (peak - data[i].value) / peak;
                maxDrawdown = Math.max(maxDrawdown, drawdown);
            }
        }
        
        return { sharpeRatio, maxDrawdown };
    }
    
    calculateUserRank(userStats, fundPerformance) {
        for (let i = 0; i < fundPerformance.length; i++) {
            if (userStats.totalReturn > fundPerformance[i].return) {
                return i + 1;
            }
        }
        return fundPerformance.length + 1;
    }
    
    generateSummaryHTML(data) {
        const { userStats, fundPerformance, userRank, isMobile, totalParticipants } = data;
        
        let html = `
            <h4>投资挑战最终总结</h4>
            <div class="year-stats">
                <p><strong>您的最终表现：</strong></p>
                <p>累计收益率: <span class="${userStats.totalReturn >= 0 ? 'positive' : 'negative'}">
                    ${userStats.totalReturn.toFixed(2)}%</span></p>
                <p>夏普比率: ${userStats.sharpeRatio.toFixed(2)}</p>
                <p>最大回撤: <span class="negative">${userStats.maxDrawdown.toFixed(2)}%</span></p>
                <p>波动率: ${userStats.volatility.toFixed(2)}%</p>
                <p>您的排名: <strong>${userRank}/${totalParticipants}</strong></p>
                <h5>基金最终排行榜 TOP 10:</h5>
        `;
        
        html += isMobile ? 
            this.generateMobileRankingHTML(fundPerformance) : 
            this.generateDesktopRankingHTML(fundPerformance);
        
        html += '<p style="margin-top: 20px; font-weight: bold;">恭喜您完成投资挑战！</p></div>';
            
        return html;
    }
    
    generateMobileRankingHTML(fundPerformance) {
        let html = '<div class="mobile-ranking-cards">';
        
        fundPerformance.slice(0, 10).forEach((fund, index) => {
            html += `
                <div class="mobile-ranking-card">
                    <div class="rank-number">${index + 1}</div>
                    <div class="fund-name">${fund.name}</div>
                    <div class="fund-stats">
                        <div>收益: <span class="${fund.return >= 0 ? 'positive' : 'negative'}">
                            ${fund.return.toFixed(2)}%</span></div>
                        <div>夏普: ${fund.sharpeRatio.toFixed(2)}</div>
                        <div>回撤: <span class="negative">${fund.maxDrawdown.toFixed(2)}%</span></div>
                    </div>
                </div>
            `;
        });
        
        return html + '</div>';
    }
    
    generateDesktopRankingHTML(fundPerformance) {
        let html = `
            <table class="summary-table" style="width:100%; border-collapse: collapse; margin-top: 10px;">
                <tr>
                    <th>排名</th>
                    <th>产品名称</th>
                    <th>累计收益</th>
                    <th>夏普比率</th>
                    <th>最大回撤</th>
                </tr>
        `;
        
        fundPerformance.slice(0, 10).forEach((fund, index) => {
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${fund.name}</td>
                    <td class="${fund.return >= 0 ? 'positive' : 'negative'}">${fund.return.toFixed(2)}%</td>
                    <td>${fund.sharpeRatio.toFixed(2)}</td>
                    <td class="negative">${fund.maxDrawdown.toFixed(2)}%</td>
                </tr>
            `;
        });
        
        return html + '</table>';
    }

    resetGameFor2022() {
        this.userPortfolio = [];
        this.selectedFund = null;
        
        const resetIndex = this.funds[0].data.findIndex(item => 
            item.date.getFullYear() === 2022 && item.date.getMonth() === 0
        );
        
        if (resetIndex !== -1) {
            this.funds.forEach(fund => {
                const resetValue = fund.data[resetIndex].value;
                for (let i = resetIndex; i < fund.data.length; i++) {
                    fund.data[i].value = fund.data[i].value / resetValue;
                }
            });
        }
    }

    startAutoPlay() {
        if (this.autoPlayInterval) return;
        
        this.autoPlayInterval = setInterval(() => {
            this.nextWeek();
        }, 1000);
        
        const autoPlayBtn = document.getElementById('auto-play');
        const pauseAutoBtn = document.getElementById('pause-auto');
        
        if (autoPlayBtn) autoPlayBtn.disabled = true;
        if (pauseAutoBtn) pauseAutoBtn.disabled = false;
    }

    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
        
        const autoPlayBtn = document.getElementById('auto-play');
        const pauseAutoBtn = document.getElementById('pause-auto');
        
        if (autoPlayBtn) autoPlayBtn.disabled = false;
        if (pauseAutoBtn) pauseAutoBtn.disabled = true;
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    window.game = new FundGame();
    
    const loadDataBtn = document.getElementById('load-data-btn');
    if (loadDataBtn) {
        loadDataBtn.addEventListener('click', () => {
            window.game.initializeGame();
        });
    }
});
