import {
  Badge,
  Button,
  Card,
  GlassPanel,
  Section,
} from "@/components/ui";

export default function UIShowcasePage() {
  return (
    <div className="page">

      <Section
        title="CardioInsight UI Kit"
        subtitle="Reusable UI Components"
      >

        <div
          style={{
            display: "grid",
            gap: "24px",
          }}
        >

          <Card>

            <h3>Default Card</h3>

            <p>
              Default surface card.
            </p>

          </Card>

          <GlassPanel>

            <h3>Glass Panel</h3>

            <p>
              Navigation & floating surfaces.
            </p>

          </GlassPanel>

          <div
            style={{
              display: "flex",
              gap: "12px",
            }}
          >

            <Button>
              Primary
            </Button>

            <Button variant="secondary">
              Secondary
            </Button>

            <Button variant="ghost">
              Ghost
            </Button>

          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
            }}
          >

            <Badge variant="primary">
              Research
            </Badge>

            <Badge variant="success">
              Completed
            </Badge>

            <Badge variant="warning">
              Pending
            </Badge>

            <Badge variant="danger">
              Error
            </Badge>

          </div>

        </div>

      </Section>

    </div>
  );
}