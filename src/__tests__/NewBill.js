/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
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
      test("posts to API ", async () => {
        jest.spyOn(mockStore, "bills");
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.innerHTML = `<div id="root"> </div>`;
        router();
        // Create root div, used by rooter
        window.onNavigate(ROUTES_PATH.NewBill)
        const newBill = new NewBill({ document, onNavigate, store, localStorage: window.localStorage })
        const button = screen.getByTestId('form-new-bill');
        const handleSubmit = jest.fn(newBill.handleSubmit);
        button.addEventListener('submit', handleSubmit);
        fireEvent.submit(button);
        expect(handleSubmit).toHaveBeenCalled();
      })
    })
  })
})

