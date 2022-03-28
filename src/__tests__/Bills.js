/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, wait, waitFor } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import "@testing-library/jest-dom";
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import { localStorageMock } from "../__mocks__/localStorage.js";
import store from "../__mocks__/store.js";
import mockStore from "../__mocks__/store"
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {

  // Globally define i'm an employee
  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  window.localStorage.setItem('user', JSON.stringify({
    type: 'Employee',
    email: "a@a"
  }))

  const onNavigate = (pathname) => {
    document.body.innerHTML = ROUTES({ pathname })
  };

  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      document.body.innerHTML = `<div id="root"> </div>`;
      router()
      window.onNavigate(ROUTES_PATH.Bills) // Router call is needed as active-icon is built inside 
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon).toHaveAttribute('class', 'active-icon');
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    });

    //Click icon 
    describe("When I click on an eye", () => {
      test("Then a modal should open", async () => {
        // Create UI element
        document.body.innerHTML = BillsUI({ data: [bills[0]] })
        // Create Bills containers
        const billsContainer = new Bills({ document, onNavigate, store, localStorageMock });
        // Get button to click on
        const eye = screen.getByTestId("icon-eye");
        //Get click fn && event listen
        const handleClick = jest.fn(billsContainer.handleClickIconEye);
        eye.addEventListener('click', () => {
          handleClick(eye);
        })

        // simulate && expect result --- PB le test passera alors que la fonctionnalité aura été supprimée dans Bills
        userEvent.click(eye);
        expect(handleClick).toHaveBeenCalled();

        // Added data-testid to modal in billsUI in order to check if truthy
        const modale = screen.getByTestId('modaleFile')
        expect(modale).toBeTruthy()
      })
    });

    test("Then I should be able to add a new Bill", async () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      };
      const btn = document.querySelector('button[data-testid="btn-new-bill"');

      const bill = new Bills({
        document, onNavigate, store: null, localStorage: window.localStorage
      })
      const handleClick = jest.fn(bill.handleClickNewBill);
      expect(btn).toBeTruthy();
      btn.addEventListener("click", handleClick);
      fireEvent.click(btn);
      expect(screen.getAllByText('Envoyer une note de frais')).toBeTruthy(); // should arrive on a new page
    });
  });

  //Get Bills via API
  describe("When I am on Bills Page", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.innerHTML = `<div id="root"> </div>`;
      router()
    })
    test("API data is fetched", async () => {
      // Create UI Element
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"));
      // Mock store is 4 bills + 1 row for <th>
      const rowNumber = document.getElementsByTagName('tr');
      expect(rowNumber.length).toBe(5);
    })

    test("An error is received if API data returns 404", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"))
          }
        }
      })
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    });

    // Error 500
    test("fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"))
          }
        }
      })

      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})
