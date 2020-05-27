import { AppPage } from './app.po';
import { browser, logging } from 'protractor';

describe('workspace-project App', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getTitleText()).toEqual('Coronavirus COVID19 Tracker');
  });

  afterEach(async () => {
    // Assert that there are no errors emitted from the browser
    const logs = await browser.manage().logs().get(logging.Type.BROWSER);
    const filteredLogs = logs
      .filter(
        (entry) =>
          !entry.message.includes(
            'Failed to load resource: the server responded with a status of 429 (Too Many Requests)'
          )
      )
      .filter(
        (entry) =>
          !entry.message.includes(
            'Backend returned code 429, body was: You have reached maximum request limit.'
          )
      )
      .filter((entry) => !entry.message.includes('HttpErrorResponse'));
    console.log(filteredLogs);
    expect(filteredLogs).not.toContain(
      jasmine.objectContaining({
        level: logging.Level.SEVERE,
      } as logging.Entry)
    );
  });
});
