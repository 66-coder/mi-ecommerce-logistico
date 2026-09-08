const AIRTABLE_TOKEN = "patduhWO9m2fvP2HS.2c2d2c49a468a681c9815eb917033be5dce3b0be3e643418fa9b5979f414fdbb";
const BASE_ID = "appZ3owVzxMEyjUKh";
const TABLE_ID_CONTACTOS = "tblW3ULDFeiHdkvqb";
const TABLE_ID_REGISTROS = "tblSlljdVyt77bp7E";

const contactosMap = {};
let registrosCache = [];

// 1. CARGAR EMPRESAS Y GUARDAR MAPA DE NOMBRES
async function cargarContactos() {
  const shipperSelect = document.getElementById('shipperSelect');
  const consigneeSelect = document.getElementById('consigneeSelect');

  if (shipperSelect) shipperSelect.innerHTML = '<option value="">Seleccione un Shipper</option>';
  if (consigneeSelect) consigneeSelect.innerHTML = '<option value="">Seleccione un Consignee</option>';

  try {
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID_CONTACTOS}`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
    });

    if (!response.ok) throw new Error("Error al conectar con Contactos");

    const data = await response.json();

    if (data.records && data.records.length > 0) {
      data.records.forEach(record => {
        const nombreEmpresa = record.fields.Name;
        if (nombreEmpresa) {
          contactosMap[record.id] = nombreEmpresa;
          const option = `<option value="${nombreEmpresa}">${nombreEmpresa}</option>`;
          if (shipperSelect) shipperSelect.innerHTML += option;
          if (consigneeSelect) consigneeSelect.innerHTML += option;
        }
      });
    }
  } catch (error) {
    console.error("Error al cargar empresas:", error);
    const empresaPrueba = '<option value="Empresa A">Empresa A (Modo Seguro)</option>';
    if (shipperSelect) shipperSelect.innerHTML += empresaPrueba;
    if (consigneeSelect) consigneeSelect.innerHTML += empresaPrueba;
  }
}

function obtenerNombreEmpresa(valor) {
  if (!valor) return "-";
  if (Array.isArray(valor)) {
    return valor.map(v => contactosMap[v] || v).join(', ');
  }
  return contactosMap[valor] || valor;
}

// ACTUALIZAR TARJETAS DE ESTADÍSTICAS (KPIs)
function actualizarKPIs(lista) {
  const kpiTotal = document.getElementById('kpiTotal');
  const kpiTransito = document.getElementById('kpiTransito');
  const kpiPuerto = document.getElementById('kpiPuerto');
  const kpiLiberados = document.getElementById('kpiLiberados');

  if (!kpiTotal) return;

  kpiTotal.textContent = lista.length;
  
  const transito = lista.filter(r => (r.fields["Estado"] || "") === "En Tránsito").length;
  const puerto = lista.filter(r => (r.fields["Estado"] || "") === "Ingresado a Puerto").length;
  const liberados = lista.filter(r => (r.fields["Estado"] || "") === "Liberado").length;

  kpiTransito.textContent = transito;
  kpiPuerto.textContent = puerto;
  kpiLiberados.textContent = liberados;
}

// MÓDULO: EDICIÓN RÁPIDA DE ESTADO (PATCH)
async function cambiarEstadoRegistro(idRecord, nuevoEstado) {
  try {
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID_REGISTROS}/${idRecord}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: { "Estado": nuevoEstado },
        typecast: true
      })
    });

    if (response.ok) {
      await cargarRegistros();
    } else {
      alert("Error al actualizar el estado en Airtable.");
    }
  } catch (error) {
    console.error("Error al cambiar estado:", error);
  }
}

// MÓDULO: ELIMINACIÓN DE REGISTRO (DELETE)
async function eliminarRegistro(idRecord, blNumber) {
  if (!confirm(`¿Está seguro de que desea eliminar el registro ${blNumber}?`)) return;

  try {
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID_REGISTROS}/${idRecord}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
    });

    if (response.ok) {
      await cargarRegistros();
    } else {
      alert("Error al eliminar el registro.");
    }
  } catch (error) {
    console.error("Error al eliminar:", error);
  }
}

// GENERAR DOCUMENTO PDF EN PESTAÑA NUEVA
function imprimirBL(bl, shipper, consignee, estado) {
  const ventanaImpresion = window.open('', '_blank');
  ventanaImpresion.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Documento BL - ${bl}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #0066cc; padding-bottom: 10px; margin-bottom: 30px; }
        .title { font-size: 22px; font-weight: bold; color: #0066cc; }
        .box { border: 1px solid #ccc; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
        .field { margin-bottom: 10px; font-size: 16px; }
        .label { font-weight: bold; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #ddd; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">BILL OF LADING (BL)</div>
        <p>Documento de Transporte de Carga</p>
      </div>

      <div class="box">
        <div class="field"><span class="label">Número de BL:</span> ${bl}</div>
        <div class="field"><span class="label">Estado de Carga:</span> ${estado}</div>
      </div>

      <div class="box">
        <div class="field"><span class="label">Shipper (Remitente):</span> ${shipper}</div>
        <div class="field"><span class="label">Consignee (Destinatario):</span> ${consignee}</div>
      </div>

      <div class="footer">
        Este documento es un comprobante de emisión digital registrado en el Sistema Logístico.
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `);
  ventanaImpresion.document.close();
}

function renderizarTabla(lista) {
  const tablaBody = document.getElementById('tablaRegistrosBody');
  if (!tablaBody) return;

  tablaBody.innerHTML = '';

  if (lista.length > 0) {
    lista.forEach(record => {
      const idRecord = record.id;
      const bl = record.fields["Numero de BL"] || "S/N";
      const shipper = obtenerNombreEmpresa(record.fields["Shipper"]);
      const consignee = obtenerNombreEmpresa(record.fields["Consignee"]);
      const estadoActual = record.fields["Estado"] || "Emitido";

      tablaBody.innerHTML += `
        <tr>
          <td><strong>${bl}</strong></td>
          <td>${shipper}</td>
          <td>${consignee}</td>
          <td>
            <select class="select-estado-tabla" onchange="cambiarEstadoRegistro('${idRecord}', this.value)">
              <option value="Emitido" ${estadoActual === 'Emitido' ? 'selected' : ''}>Emitido</option>
              <option value="En Tránsito" ${estadoActual === 'En Tránsito' ? 'selected' : ''}>En Tránsito</option>
              <option value="Ingresado a Puerto" ${estadoActual === 'Ingresado a Puerto' ? 'selected' : ''}>Ingresado a Puerto</option>
              <option value="Liberado" ${estadoActual === 'Liberado' ? 'selected' : ''}>Liberado</option>
            </select>
          </td>
          <td>
            <button class="btn-action btn-pdf" onclick="imprimirBL('${bl}', '${shipper}', '${consignee}', '${estadoActual}')">PDF</button>
            <button class="btn-action btn-delete" onclick="eliminarRegistro('${idRecord}', '${bl}')">Eliminar</button>
          </td>
        </tr>
      `;
    });
  } else {
    tablaBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No se encontraron registros.</td></tr>';
  }
}

// CARGAR REGISTROS EMITIDOS
async function cargarRegistros() {
  try {
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID_REGISTROS}`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
    });

    if (!response.ok) throw new Error("Error al obtener los registros.");

    const data = await response.json();
    registrosCache = data.records || [];
    
    actualizarKPIs(registrosCache);
    renderizarTabla(registrosCache);
  } catch (error) {
    console.error("Error al cargar la tabla:", error);
    const tablaBody = document.getElementById('tablaRegistrosBody');
    if (tablaBody) {
      tablaBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Error al cargar registros.</td></tr>';
    }
  }
}

// Auto-formato del BL a Mayúsculas
const inputBL = document.getElementById('blNumber');
if (inputBL) {
  inputBL.addEventListener('input', function() {
    this.value = this.value.toUpperCase();
  });
}

// Buscador en tiempo real
const inputBuscar = document.getElementById('buscarBL');
if (inputBuscar) {
  inputBuscar.addEventListener('input', function(e) {
    const busqueda = e.target.value.toLowerCase();
    const filtrados = registrosCache.filter(record => {
      const bl = (record.fields["Numero de BL"] || "").toLowerCase();
      const shipper = obtenerNombreEmpresa(record.fields["Shipper"]).toLowerCase();
      const consignee = obtenerNombreEmpresa(record.fields["Consignee"]).toLowerCase();
      const estado = (record.fields["Estado"] || "").toLowerCase();
      return bl.includes(busqueda) || shipper.includes(busqueda) || consignee.includes(busqueda) || estado.includes(busqueda);
    });
    renderizarTabla(filtrados);
  });
}

window.onload = async function() {
  await cargarContactos();
  await cargarRegistros();
};

// GUARDAR NUEVO ENVÍO
const formShipping = document.getElementById('shippingForm');
if (formShipping) {
  formShipping.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const blValue = document.getElementById('blNumber').value.trim();
    const shipperValue = document.getElementById('shipperSelect').value;
    const consigneeValue = document.getElementById('consigneeSelect').value;
    const estadoValue = document.getElementById('estadoSelect').value;
    const statusMsg = document.getElementById('statusMessage');

    if (!blValue || !shipperValue || !consigneeValue || !estadoValue) {
      statusMsg.textContent = "Por favor complete todos los campos.";
      statusMsg.style.color = "red";
      return;
    }

    if (shipperValue === consigneeValue) {
      statusMsg.textContent = "El Shipper y el Consignee no pueden ser la misma empresa.";
      statusMsg.style.color = "red";
    }

    statusMsg.textContent = "Guardando envío...";
    statusMsg.style.color = "#0066cc";

    try {
      const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID_REGISTROS}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            "Numero de BL": blValue,
            "Shipper": shipperValue,
            "Consignee": consigneeValue,
            "Estado": estadoValue
          },
          typecast: true
        })
      });

      if (response.ok) {
        statusMsg.textContent = "¡Envío registrado con éxito!";
        statusMsg.style.color = "green";
        document.getElementById('shippingForm').reset();
        await cargarRegistros();
      } else {
        const errorData = await response.json();
        console.error(errorData);
        statusMsg.textContent = "Error al guardar. Revisa la consola.";
        statusMsg.style.color = "red";
      }
    } catch (error) {
      console.error(error);
      statusMsg.textContent = "Error de red.";
      statusMsg.style.color = "red";
    }
  });
}
