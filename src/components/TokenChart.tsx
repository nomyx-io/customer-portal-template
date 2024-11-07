import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

Chart.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const TokenChart = ({ token }: any) => {
    const [deposits, setDeposits] = useState<any[]>(token.deposits || []);
    
      const originationAmount = Math.abs(token.loanAmount); // Assuming positive value for demonstration
    
      // Adjusting chartData to reflect the origination amount once and then display deposits
      const chartData = {
        labels: ['Origination Amount', ...deposits.map((deposit: any) => `Deposit ${deposit.objectId}`)],
        datasets: [
          {
            label: '',
            data: [originationAmount, ...deposits.map((deposit: any) => deposit.amount)],
            backgroundColor: ['rgba(255, 159, 64, 0.2)', ...deposits.map(() => 'rgba(54, 162, 235, 0.2)')],
            borderColor: ['rgba(255, 159, 64, 1)', ...deposits.map(() => 'rgba(54, 162, 235, 1)')],
            borderWidth: 1,
          },
        ],
      };
      
      // Include the custom plugin in your chart options
  const options: any = {
    responsive: true,
    plugins: {
      tooltip: {
        enabled: true,
        callbacks: {
          // This callback is used to determine the title of the tooltip
          title: function(context: any) {
            // For simplicity, we're using the first item in context, but you might want to customize this
            const title = context.length ? context[0].label : '';
            return title;
          },
          // This callback customizes the label shown within the tooltip
          label: function(context: any) {
            let label = context.dataset.label || '';
  
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y;
            }
            return label;
          },
          // This callback allows you to add additional text to the tooltip, such as your origination amount
          afterBody: function(context: any) {
            return `Origination: ${originationAmount}`;
          }
        }
      },
      legend: {
        position: 'top',
        display: false,
        labels: {
          filter: function(item: any, chart: any) {
            return item.text !== '';
          }
        }
      },
      title: {
        display: true,
        text: `Loan Origination Amount: $${originationAmount}`,
        font: {
          size: 24,
        },
        padding: {
          top: 10,
          bottom: 30
        },
      },
      annotation: {
        annotations: {
          originationAmountAnnotation: {
            type: 'box',
            xMin: -0.5,
            xMax: 0.5,
            yMin: 0,
            yMax: originationAmount,
            backgroundColor: 'rgba(255, 159, 64, 0.25)',
            borderWidth: 0,
            label: {
              enabled: true,
              content: `Origination: ${originationAmount}`,
              position: 'center',
              color: 'black',
            }
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
            display: false,
          },
      },
      y: {
        beginAtZero: true,
      },
    },
  };
    
      return <Bar options={options} data={chartData} />;
  };
  
  export default TokenChart;