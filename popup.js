document.getElementById('btn').addEventListener('click', async () => {
  // 1. Получаем домен активной вкладки
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  const originUrl = new URL(tab.url).origin;

  const RULE_ID = 1;

  try {
    // 2. Регистрируем более надежное правило подмены
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [RULE_ID], 
      addRules: [{
        id: RULE_ID,
        priority: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: [
            // Полностью удаляем старый заголовок и ставим правильный кусок
            { header: "host", operation: "set", value: "kaspi.kz" },
            { header: "origin", operation: "set", value: "https://kaspi.kz" },
            { header: "referer", operation: "set", value: "https://kaspi.kz/shop/p/chehol-dlja-apple-iphone-13-prozrachnyi-106185651/?c=515433100" }
          ]
        },
        condition: {
          // Упрощенный фильтр: сработает на любой запрос, содержащий этот путь
          urlFilter: "kaspi.kz/yml/offer-view/offers/*",
          resourceTypes: ["xmlhttprequest"]
        }
      }]
    });

    // 3. Вызываем функцию запроса к API
    const data = await fromTab();
    console.log('Успешный ответ от API Kaspi:', data);

  } catch (err) {
    console.error('Ошибка в процессе запроса:', err);
  } finally {
    // 4. Удаляем правило после выполнения fetch
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [RULE_ID]
    });
  }
});


document.getElementById('my-btn').addEventListener('click', async () => {
  // 1. Получаем домен активной вкладки (например, "https://github.com")
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  const originUrl = new URL(tab.url).origin;

  const RULE_ID = 1;

  // 2. Регистрируем динамическое правило для подмены Origin
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [RULE_ID], // Очищаем старое правило, если осталось
    addRules: [{
      id: RULE_ID,
      priority: 1,
      action: {
        type: "modifyHeaders",
        requestHeaders: [
          { header: "origin", operation: "set", value: originUrl }
        ]
      },
      condition: {
        // Правило сработает только для запросов к этому API
        urlFilter: "https://example.com*", 
        resourceTypes: ["xmlhttprequest"]
      }
    }]
  });

  // 3. Делаем обычный fetch прямо из popup
  try {
    const response = await fetch('https://kaspi.kz');
    // const data = await response.json();
    // console.log('Успешный ответ с подмененным Origin:', data);
    await fromTab();
  } catch (err) {
    console.error('Ошибка запроса:', err);
  } finally {
    // 4. Обязательно удаляем правило, чтобы не аффектить другие запросы
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [RULE_ID]
    });
  }
});

async function fromTab(){
  fetch("https://kaspi.kz/yml/offer-view/offers/106185651", {
    "headers": {
      "accept": "application/json, text/*",
      "accept-language": "ru-RU,ru;q=0.5",
      "content-type": "application/json; charset=UTF-8",
      "x-ks-city": "515433100"
    },
    "referrer": "https://kaspi.kz/shop/p/chehol-dlja-apple-iphone-13-prozrachnyi-106185651/?c=515433100",
    "body": "{\"cityId\":\"515433100\",\"id\":\"106185651\",\"merchantUID\":[],\"limit\":5,\"page\":0,\"product\":{\"brand\":\"Без бренда\",\"categoryCodes\":[\"Phone cases\",\"Phone accessories\",\"Smartphones and gadgets\",\"Categories\"],\"baseProductCodes\":[],\"groups\":null,\"productSeries\":[]},\"sortOption\":\"PRICE\",\"highRating\":null,\"searchText\":null,\"isExcellentMerchant\":false,\"zoneId\":[\"515433100\"],\"installationId\":\"-1\"}",
    "method": "POST",
    "mode": "cors",
    "credentials": "include"
  });
}
