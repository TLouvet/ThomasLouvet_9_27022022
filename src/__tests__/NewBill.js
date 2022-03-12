/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import mockStore from "../__mocks__/store"
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import router from "../app/Router.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import store from "../__mocks__/store";

jest.mock("../app/store", () => mockStore)


describe("Given I am connected as an employee", () => {

  // Globally define i am an emplyee
  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  window.localStorage.setItem('user', JSON.stringify({
    type: 'Employee'
  }))

  const onNavigate = (pathname) => {
    document.body.innerHTML = ROUTES({ pathname })
  };

  describe("When I am on NewBill Page", () => {
    test("Then it should render new bill Page", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
    })

    describe("When I upload a new file", () => {
      test("Then a file is added to formData", async () => {
        // Create root div, used by rooter
        document.body.innerHTML = NewBillUI();
        const newBill = new NewBill({ document, onNavigate, store, localStorage: window.localStorage })

        // Get input to fill
        const input = document.querySelector(`input[data-testid="file"]`);
        const handleFile = jest.fn(newBill.handleChangeFile);
        input.addEventListener("change", handleFile);

        // Create file test
        const file = new File([new ArrayBuffer(1)], 'testfile.jpg');
        Object.defineProperty(input, 'files', {
          value: [file]
        })
        fireEvent.change(input);

        expect(handleFile).toHaveBeenCalled();
      });
    });

    describe("When I send a new bill", () => {
      test("Then All fields have a value", () => {
        jest.spyOn(mockStore, "bills")
        document.body.innerHTML = `<div id="root"> </div>`;
        router();
        window.onNavigate(ROUTES_PATH.NewBill);
        // Need to get the button

        // J'ai besoin de valider le formulaire

      })
    })
    // Je dois tester que tout ait une value ,
  })

})
