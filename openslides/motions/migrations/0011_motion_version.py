# Generated by Django 2.1 on 2018-08-31 13:17

import django.db.models.deletion
import jsonfield.encoder
import jsonfield.fields
from django.db import migrations, models


def copy_motion_version_content_to_motion(apps, schema_editor):
    """
    Move all motion version content of the active version to the motion.
    """
    Motion = apps.get_model("motions", "Motion")

    for motion in Motion.objects.all():
        motion.title = motion.active_version.title
        motion.text = motion.active_version.text
        motion.reason = motion.active_version.reason
        motion.modified_final_version = motion.active_version.modified_final_version
        motion.amendment_paragraphs = motion.active_version.amendment_paragraphs
        motion.save(skip_autoupdate=True)


def migrate_active_change_recommendations(apps, schema_editor):
    """
    Delete all change recommendation of motion versions, that are not active. For active
    change recommendations the motion id will be set.
    """
    MotionChangeRecommendation = apps.get_model("motions", "MotionChangeRecommendation")
    to_delete = []
    for cr in MotionChangeRecommendation.objects.all():
        # chack if version id matches the active version of the motion
        if cr.motion_version.id == cr.motion_version.motion.active_version.id:
            cr.motion = cr.motion_version.motion
            cr.save(skip_autoupdate=True)
        else:
            to_delete.append(cr)

    # delete non active change recommendations
    for cr in to_delete:
        cr.delete(skip_autoupdate=True)


class Migration(migrations.Migration):

    dependencies = [("motions", "0010_auto_20180822_1042")]

    operations = [
        # Create new fields. Title and Text have empty defaults, but the values
        # should be overwritten by copy_motion_version_content_to_motion. In the next
        # migration file these defaults are removed.
        migrations.AddField(
            model_name="motion",
            name="title",
            field=models.CharField(max_length=255, default=""),
        ),
        migrations.AddField(
            model_name="motion", name="text", field=models.TextField(default="")
        ),
        migrations.AddField(
            model_name="motion",
            name="reason",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="motion",
            name="modified_final_version",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="motion",
            name="amendment_paragraphs",
            field=jsonfield.fields.JSONField(
                dump_kwargs={
                    "cls": jsonfield.encoder.JSONEncoder,
                    "separators": (",", ":"),
                },
                load_kwargs={},
                null=True,
            ),
        ),
        # Copy old motion version data
        migrations.RunPython(copy_motion_version_content_to_motion),
        # Change recommendations
        migrations.AddField(
            model_name="motionchangerecommendation",
            name="motion",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                null=True,  # This is reverted in the next migration
                related_name="change_recommendations",
                to="motions.Motion",
            ),
        ),
        migrations.RunPython(migrate_active_change_recommendations),
        migrations.RemoveField(
            model_name="motionchangerecommendation", name="motion_version"
        ),
        # remove motion version references from motion and state.
        migrations.RemoveField(model_name="motion", name="active_version"),
        migrations.AlterUniqueTogether(name="motionversion", unique_together=set()),
        migrations.RemoveField(model_name="motionversion", name="motion"),
        migrations.RemoveField(model_name="state", name="leave_old_version_active"),
        migrations.RemoveField(model_name="state", name="versioning"),
        # Delete motion version.
        migrations.DeleteModel(name="MotionVersion"),
    ]
