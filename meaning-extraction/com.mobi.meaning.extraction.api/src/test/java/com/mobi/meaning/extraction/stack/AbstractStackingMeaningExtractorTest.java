package com.mobi.meaning.extraction.stack;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.runners.MockitoJUnitRunner;

@RunWith(MockitoJUnitRunner.class)
public class AbstractStackingMeaningExtractorTest {

    private StackingMeaningExtractor<ExampleStackItem> testing;

    @Before
    public void initExtractor() {
        this.testing = new ExampleStackingMeaningExtractor();
    }

    @Test
    public void testCurrentLocation() {
        Assert.assertNotNull(testing.getCurrentLocation());
        testing.pushStack(new ExampleStackItem("root"));
        Assert.assertEquals("{root}", testing.getCurrentLocation());
        testing.pushStack(new ExampleStackItem("first"));
        Assert.assertEquals("{root|first}", testing.getCurrentLocation());
        testing.pushStack(new ExampleStackItem("second"));
        Assert.assertEquals("{root|first|second}", testing.getCurrentLocation());
        Assert.assertEquals("second", testing.popStack().getIdentifier());
        Assert.assertEquals("{root|first}", testing.getCurrentLocation());
    }


}
