"use strict";
// Configura os eventos
(function () {
    const botaoBusca = document.querySelector("#botao_busca");
    const campoNomeCidade = document.querySelector("#campo-nome-cidade");
    if (campoNomeCidade && botaoBusca) {
        botaoBusca.addEventListener("click", function () {
            buscaCoordenadas(campoNomeCidade.value);
        });
        campoNomeCidade === null || campoNomeCidade === void 0 ? void 0 : campoNomeCidade.addEventListener("keyup", function (e) {
            if (e.code == "Enter" || e.code == "NumpadEnter") {
                buscaCoordenadas(campoNomeCidade.value);
                campoNomeCidade.blur();
            }
        });
    }
})();
const WEATHER_CODES = new Map([
    [0, { desc: "Céu limpo", img: "sol.svg" }],
    [1, { desc: "Céu predominantemente limpo", img: "sol_predominante.svg" }],
    [2, { desc: "Céu parcialmente nublado", img: "sol_nuvens.svg" }],
    [3, { desc: "Céu nublado", img: "nublado.svg" }],
    [45, { desc: "Neblina", img: "neblina.svg" }],
    [48, { desc: "Sincelo", img: "" }],
    [51, { desc: "Chuvisco leve", img: "chuva.svg" }],
    [53, { desc: "Chuvisco moderado", img: "chuva.svg" }],
    [55, { desc: "Chuvisco intenso", img: "chuva.svg" }],
    [56, { desc: "Chuvisco congelante leve", img: "chuva.svg" }],
    [57, { desc: "Chuvisco congelante intenso", img: "chuva.svg" }],
    [61, { desc: "Chuva leve", img: "chuva.svg" }],
    [63, { desc: "Chuva moderada", img: "chuva.svg" }],
    [65, { desc: "Chuva intensa", img: "chuva.svg" }],
    [66, { desc: "Chuva congelante leve", img: "chuva.svg" }],
    [67, { desc: "Chuva congelante intensa", img: "chuva.svg" }],
    [71, { desc: "Queda de neve leve", img: "" }],
    [73, { desc: "Queda de neve moderada", img: "" }],
    [75, { desc: "Queda de neve intensa", img: "" }],
    [77, { desc: "Neve granular", img: "" }],
    [80, { desc: "Leves pancadas de chuva", img: "chuva.svg" }],
    [81, { desc: "Pancadas de chuva", img: "chuva.svg" }],
    [82, { desc: "Fortes pancadas de chuva", img: "chuva.svg" }],
    [85, { desc: "Nevasca leve", img: "" }],
    [86, { desc: "Nevasca intensa", img: "" }],
    [95, { desc: "Tempestade", img: "tempestade.svg" }],
    [96, { desc: "Tempestade com granizo", img: "tempestade.svg" }],
    [99, { desc: "Tempestade com granizo intenso", img: "tempestade.svg" }],
]);
// ---------------------------------------------------------------------------------------
function getWeatherCodeDesc(code) {
    return WEATHER_CODES.get(code);
}
// ---------------------------------------------------------------------------------------
function getUVString(valorIndice) {
    if (valorIndice < 3) {
        return "Baixo";
    }
    else if (valorIndice < 6) {
        return "Moderado";
    }
    else if (valorIndice < 8) {
        return "Alto";
    }
    else if (valorIndice < 11) {
        return "Muito alto";
    }
    return "Extremo";
}
// ---------------------------------------------------------------------------------------
function buscaCoordenadas(nomeCidade) {
    // debugger;
    if (nomeCidade.length > 0) {
        //TODO: validate input
        const param = encodeURIComponent(nomeCidade);
        const url = "https://nominatim.openstreetmap.org/search?q=" + param + "&format=geojson";
        const coordinatesRequest = new XMLHttpRequest();
        coordinatesRequest.addEventListener("load", requestLoadHandler);
        coordinatesRequest.addEventListener("error", requestErrorHandler);
        coordinatesRequest.open("GET", url);
        coordinatesRequest.send();
    }
}
// ---------------------------------------------------------------------------------------
function requestLoadHandler() {
    if (this.readyState == 4 && this.status == 200) {
        let geoJSON = JSON.parse(this.response);
        let len = Object.keys(geoJSON.features).length;
        if (geoJSON && len > 0) {
            const features = geoJSON.features[0];
            const [longitude, latitude] = features.geometry.coordinates;
            const displayName = features["properties"]["display_name"];
            const displayNameArr = displayName.split(',');
            const nomeCidade = displayNameArr[0];
            const nomePais = displayNameArr[displayNameArr.length - 1];
            const url = "https://api.open-meteo.com/v1/forecast?latitude=" + latitude + "&longitude=" + longitude + "&hourly=temperature_2m,precipitation_probability,rain,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_sum,precipitation_probability_max&timeformat=unixtime&timezone=America%2FSao_Paulo";
            const weatherRequest = new XMLHttpRequest();
            weatherRequest.addEventListener("load", weatherRequestLoadHandler);
            weatherRequest.addEventListener("error", weatherRequestErrorHandler);
            weatherRequest.open("GET", url);
            weatherRequest.send();
            let nomeCidadeElement = document.querySelector("#nome-cidade");
            if (nomeCidadeElement) {
                // Não exibir elemento imediatamente na primeira consulta,
                //  pois posicionamento ficará momentaneamente incorreto até os demais elementos serem carregados
                if (nomeCidadeElement.innerHTML.length == 0) {
                    nomeCidadeElement.hidden = true;
                }
                nomeCidadeElement.innerHTML = `
                    <h1 title='${displayName}' class='titulo-cidade'>
                        ${nomeCidade}, ${nomePais}
                    </h1>
                `;
            }
        }
        else {
            // TODO: Exibir ao usuario uma mensagem informativa
            console.error("Nome de cidade invalido");
        }
    }
}
// ---------------------------------------------------------------------------------------
function requestErrorHandler() {
    console.error(this.response);
}
// ---------------------------------------------------------------------------------------
function weatherRequestLoadHandler() {
    if (this.readyState == 4 && this.status == 200) {
        const weatherJSON = JSON.parse(this.response);
        const dailyUnits = weatherJSON.daily_units;
        const daily = weatherJSON.daily;
        const previsaoBody = document.querySelector(".semana-grid");
        let content = "";
        const dailyTimeArr = daily["time"];
        const arrLenght = dailyTimeArr.length;
        for (let x = 0; x < arrLenght; ++x) {
            const date = new Date(dailyTimeArr[x] * 1000);
            const dateOptions = {
                weekday: "long",
                day: "numeric",
                month: "long",
                // year: "numeric"
            };
            const dateStr = date.toLocaleDateString("pt-BR", dateOptions);
            const [diaSemana, data] = dateStr.split(',');
            const weatherCode = getWeatherCodeDesc(daily["weather_code"][x]);
            const probabilidadePrecipitacao = daily["precipitation_probability_max"][x] + dailyUnits.precipitation_probability_max;
            const precipitacaoSoma = daily["precipitation_sum"][x] + dailyUnits.precipitation_sum;
            const tempMax = daily["temperature_2m_max"][x] + " " + dailyUnits.temperature_2m_max;
            const tempMin = daily["temperature_2m_min"][x] + " " + dailyUnits.temperature_2m_min;
            const indiceUV = daily.uv_index_max[x];
            let nomeImg = "placeholder.svg";
            if (weatherCode === null || weatherCode === void 0 ? void 0 : weatherCode.img.length) {
                nomeImg = weatherCode.img;
            }
            content += `
                <div class='semana-grid-item'>
                    <div class='semana-grid-item-left'>
                        <img src='img/${nomeImg}' width='100px' height='100px'></img>
                        <h3>${diaSemana}<div class='cartao-nome-dia'>${data}</div></h3>
                    </div>

                    <div class='semana-grid-item-right'>
                        <p class='cartao-titulo'>${weatherCode === null || weatherCode === void 0 ? void 0 : weatherCode.desc}</p>
                        <hr class='cartao-separador'/>

                        <div class='cartao-grid'>
                            <div class='cartao-icone-tempo'><img src='img/max.svg' width='16' height='16'></div>
                            <div>Máx: </div>
                            <div class='cartao-valor'>${tempMax}</div>

                            <div class='cartao-icone-tempo'><img src='img/min.svg' width='16' height='16'></div>
                            <div>Mín: </div>
                            <div class='cartao-valor'>${tempMin}</div>

                            <div class='cartao-icone-tempo'><img src='img/precipitacao.svg' width='16' height='16'></div>
                            <div>Precipitação: </div>
                            <div class='cartao-valor'>${precipitacaoSoma} (${probabilidadePrecipitacao}) </div>

                            <div class='cartao-icone-tempo'><img src='img/uv.svg' width='16' height='16'></div>
                            <div>Índice UV: </div>
                            <div class='cartao-valor'>${indiceUV} (${getUVString(indiceUV)}) </div>

                        </div>
                    </div>
                </div>
            `;
        }
        // Atualiza conteudo dos cartões e exibe o elemento com o nome da cidade
        if (previsaoBody) {
            previsaoBody.innerHTML = content;
        }
        const cidadeElement = document.querySelector("#nome-cidade");
        if (cidadeElement) {
            cidadeElement.hidden = false;
        }
    }
}
// ---------------------------------------------------------------------------------------
function weatherRequestErrorHandler() {
    console.error(this.response);
}
