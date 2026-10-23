import { type ReactNode, useState } from "react";
import { Badge } from "../../components/Badge/Badge";
import { ErrorBanner } from "../../components/ErrorBanner/ErrorBanner";
import { Panel } from "../../components/Panel/Panel";
import { RoundStatsCharts } from "../../components/RoundStatsCharts/RoundStatsCharts";
import { TabStrip } from "../../components/Tabs/TabStrip";
import { tabId, tabPanelId } from "../../components/Tabs/tabIds";
import { ToggleSwitch } from "../../components/ToggleSwitch/ToggleSwitch";
import { notChosen } from "../../domain/round/results";
import { unverifiedSubmissions, verifiedSubmissions } from "../../domain/submission/admin";
import { useAdminActiveRound } from "../../hooks/queries/admin";
import { usePageTitle } from "../../hooks/usePageTitle";
import { readStored, writeStored } from "../../utils/storage";
import { CreateRoundPanel } from "./CreateRoundPanel";
import { EndRoundWizard } from "./EndRoundWizard";
import { PreviousRoundsAdmin } from "./PreviousRoundsAdmin";
import { RoundHeader } from "./RoundHeader";
import { SubmissionTables } from "./SubmissionTables";
import styles from "./AdminPage.module.css";

type AdminTab = "unverified" | "current" | "past";

type AdminTabDefinition = {
    id: AdminTab;
    label: ReactNode;
};

const STREAMING_KEY = "admin-streaming";
const TAB_PREFIX = "admin";

export function AdminPage() {
    usePageTitle("Admin");
    const { round, loading, error } = useAdminActiveRound();
    const [tab, setTab] = useState<AdminTab>("unverified");
    const [ending, setEnding] = useState(false);
    const [streaming, setStreaming] = useState(() => readStored<boolean>("local", STREAMING_KEY) === true);

    if (loading) {
        return <div className="loading">Loading the active round...</div>;
    }

    if (error) {
        return <ErrorBanner message={error} />;
    }

    function changeStreaming(on: boolean) {
        setStreaming(on);
        writeStored("local", STREAMING_KEY, on);
    }

    const toVerify = round ? unverifiedSubmissions(round).length : 0;
    const tabs: AdminTabDefinition[] = round
        ? [
              {
                  id: "unverified",
                  label: (
                      <>
                          To verify <Badge tone={toVerify > 0 ? "danger" : "muted"}>{toVerify}</Badge>
                      </>
                  ),
              },
              {
                  id: "current",
                  label: (
                      <>
                          Entries <Badge>{notChosen(verifiedSubmissions(round)).length}</Badge>
                      </>
                  ),
              },
              { id: "past", label: "Past rounds" },
          ]
        : [{ id: "past", label: "Past rounds" }];
    const active = tabs.some(candidate => candidate.id === tab) ? tab : "past";

    return (
        <div className={styles.page}>
            {round ? (
                <>
                    <RoundHeader round={round} onEndRound={() => setEnding(true)} />
                    <Panel title="Round statistics">
                        <RoundStatsCharts roundId={round.id} />
                    </Panel>
                </>
            ) : (
                <CreateRoundPanel onCreated={() => setTab("unverified")} />
            )}

            <div className={styles.sections}>
                <div className={styles.tabRow}>
                    <TabStrip
                        tabs={tabs}
                        active={active}
                        onSelect={setTab}
                        idPrefix={TAB_PREFIX}
                        ariaLabel="Admin sections"
                        className={styles.tabs}
                    />
                    <div className={styles.streaming}>
                        <ToggleSwitch label="Streaming" enabled={streaming} onChange={changeStreaming} />
                    </div>
                </div>

                <Panel
                    role="tabpanel"
                    id={tabPanelId(TAB_PREFIX, active)}
                    aria-labelledby={tabId(TAB_PREFIX, active)}
                    className={styles.content}
                >
                    {round && (active === "unverified" || active === "current") && (
                        <SubmissionTables round={round} table={active} streaming={streaming} />
                    )}
                    {active === "past" && <PreviousRoundsAdmin streaming={streaming} />}
                </Panel>
            </div>

            {round && <EndRoundWizard open={ending} onClose={() => setEnding(false)} round={round} />}
        </div>
    );
}
