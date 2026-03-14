const montoInput = document.getElementById("monto");
const monedaSelect = document.getElementById("moneda");
const btnBuscar = document.getElementById("buscar");
const resultado = document.getElementById("resultado");
const errorDOM = document.getElementById("error");
const canvas = document.getElementById("myChart");

let chartInstance = null;

// Obtiene valor actual de una moneda.
// Primero intenta API real.
// Si falla, usa el archivo local indicador.json como respaldo.
const getIndicadores = async () => {
  try {
    const res = await fetch("https://mindicador.cl/api");
    if (!res.ok) throw new Error("No se pudo obtener información desde la API");
    return await res.json();
  } catch (error) {
    const resLocal = await fetch("./assets/js/indicador.json");
    if (!resLocal.ok) throw new Error("No se pudo cargar ni la API ni el archivo local");
    return await resLocal.json();
  }
};

// Obtiene historial para gráfico.
// Si falla la API histórica, retorna null y simplemente no grafica historial real.
const getHistorial = async (moneda) => {
  try {
    const res = await fetch(`https://mindicador.cl/api/${moneda}`);
    if (!res.ok) throw new Error("No se pudo obtener historial");
    const data = await res.json();

    return data.serie.slice(0, 10).reverse();
  } catch (error) {
    return null;
  }
};

const renderGrafico = (historial, moneda) => {
  if (!historial || historial.length === 0) return;

  const labels = historial.map((item) =>
    new Date(item.fecha).toLocaleDateString("es-CL")
  );

  const valores = historial.map((item) => item.valor);

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: `Historial últimos 10 días (${moneda})`,
          data: valores,
          borderWidth: 2,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
        },
      },
    },
  });
};

const convertirMoneda = async () => {
  errorDOM.textContent = "";
  resultado.textContent = "Resultado: $0";

  try {
    const monto = Number(montoInput.value);
    const moneda = monedaSelect.value;

    if (!monto || monto <= 0) {
      throw new Error("Debes ingresar un monto válido en pesos chilenos.");
    }

    if (!moneda) {
      throw new Error("Debes seleccionar una moneda.");
    }

    const indicadores = await getIndicadores();

    if (!indicadores[moneda] || !indicadores[moneda].valor) {
      throw new Error("No fue posible obtener el valor de la moneda seleccionada.");
    }

    const valorMoneda = indicadores[moneda].valor;
    const conversion = monto / valorMoneda;

    resultado.textContent = `Resultado: ${conversion.toLocaleString("es-CL", {
      style: "currency",
      currency: moneda === "dolar" ? "USD" : "EUR",
      minimumFractionDigits: 2,
    })}`;

    const historial = await getHistorial(moneda);
    renderGrafico(historial, moneda);
  } catch (error) {
    errorDOM.textContent = error.message;
  }
};

btnBuscar.addEventListener("click", convertirMoneda);